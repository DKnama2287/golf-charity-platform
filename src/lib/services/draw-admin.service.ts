import { connectToDatabase } from "@/lib/db/mongodb";
import { DrawModel } from "@/lib/models/draw";
import { ScoreModel } from "@/lib/models/score";
import { UserModel } from "@/lib/models/user";
import { WinningModel } from "@/lib/models/winning";
import { CharityModel } from "@/lib/models/charity";
import { runDraw, simulateDraw } from "@/lib/services/draw.service";
import { sendWinnerNotificationEmail, sendDrawPublishedEmail } from "@/lib/services/email.service";

function getCurrentDrawMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function getParticipantsAndPool() {
  await connectToDatabase();

  const users = await UserModel.find().lean();
  const scores = await ScoreModel.find().lean();
  const activeUsers = users.filter((user) => user.subscription?.status === "active");

  const participants = activeUsers.map((user) => ({
    userId: String(user._id),
    userName: user.name,
    scores: scores
      .filter((score) => score.userId === String(user._id))
      .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
      .slice(0, 5)
      .map((score) => score.score),
  }));

  const prizePoolAmount = activeUsers.reduce((sum, user) => {
      const amount =
        user.subscription?.plan === "yearly"
          ? user.subscription?.yearlyPrice ?? 0
          : user.subscription?.monthlyPrice ?? 0;
      return sum + amount;
    }, 0);

  return { activeUsers, participants, prizePoolAmount };
}

async function getLatestPublishedDraw() {
  await connectToDatabase();
  return DrawModel.findOne({ published: true, isSimulation: false })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createSimulationDraw(mode: "random" | "weighted") {
  const { participants, prizePoolAmount } = await getParticipantsAndPool();
  const latestPublished = await getLatestPublishedDraw();
  const jackpotRollover = latestPublished?.nextJackpotRollover ?? 0;

  const result = simulateDraw({
    participants,
    prizePoolAmount,
    jackpotRollover,
    mode,
  });

  const draw = await DrawModel.create({
    mode: result.mode,
    drawMonth: getCurrentDrawMonth(),
    numbers: result.numbers,
    isSimulation: true,
    published: false,
    previousJackpotRollover: result.previousJackpotRollover,
    nextJackpotRollover: result.nextJackpotRollover,
    prizePoolAmount,
    participantCount: participants.length,
    winners: {
      match5: result.tierOutcomes.match5.winners.length,
      match4: result.tierOutcomes.match4.winners.length,
      match3: result.tierOutcomes.match3.winners.length,
    },
  });

  return { draw, result };
}

export async function createReadyDraw(mode: "random" | "weighted") {
  const currentMonth = getCurrentDrawMonth();

  await connectToDatabase();
  const existingPublished = await DrawModel.findOne({
    drawMonth: currentMonth,
    published: true,
    isSimulation: false,
  }).lean();

  if (existingPublished) {
    throw new Error(`An official draw has already been published for ${currentMonth}.`);
  }

  const { participants, prizePoolAmount } = await getParticipantsAndPool();
  const latestPublished = await getLatestPublishedDraw();
  const jackpotRollover = latestPublished?.nextJackpotRollover ?? 0;

  const result = runDraw({
    participants,
    prizePoolAmount,
    jackpotRollover,
    mode,
  });

  const draw = await DrawModel.create({
    mode: result.mode,
    drawMonth: currentMonth,
    numbers: result.numbers,
    isSimulation: false,
    published: false,
    previousJackpotRollover: result.previousJackpotRollover,
    nextJackpotRollover: result.nextJackpotRollover,
    prizePoolAmount,
    participantCount: participants.length,
    winners: {
      match5: result.tierOutcomes.match5.winners.length,
      match4: result.tierOutcomes.match4.winners.length,
      match3: result.tierOutcomes.match3.winners.length,
    },
  });

  return { draw, result };
}

export async function publishDraw(drawId: string) {
  await connectToDatabase();

  const draw = await DrawModel.findById(drawId);

  if (!draw) {
    throw new Error("Draw not found.");
  }

  if (draw.isSimulation) {
    throw new Error("Simulation draws cannot be published.");
  }

  if (draw.published) {
    throw new Error("This draw is already published.");
  }

  const existingPublished = await DrawModel.findOne({
    drawMonth: draw.drawMonth,
    published: true,
    isSimulation: false,
    _id: { $ne: draw._id },
  }).lean();

  if (existingPublished) {
    throw new Error(`An official draw has already been published for ${draw.drawMonth}.`);
  }

  const { activeUsers, participants, prizePoolAmount } = await getParticipantsAndPool();

  // Auto-calculate prize pool distribution based on fixed percentages
  const tierAmounts = {
    match5: prizePoolAmount * 0.4 + (draw.previousJackpotRollover || 0),
    match4: prizePoolAmount * 0.35,
    match3: prizePoolAmount * 0.25,
  };

  const result = runDraw({
    participants,
    prizePoolAmount,
    jackpotRollover: draw.previousJackpotRollover,
    mode: draw.mode,
    randomNumbers: [...draw.numbers],
  });

  draw.published = true;
  draw.publishedAt = new Date().toISOString();
  draw.nextJackpotRollover = result.nextJackpotRollover;
  draw.prizePoolAmount = prizePoolAmount;
  draw.participantCount = participants.length;
  draw.winners = {
    match5: result.tierOutcomes.match5.winners.length,
    match4: result.tierOutcomes.match4.winners.length,
    match3: result.tierOutcomes.match3.winners.length,
  };
  await draw.save();

  for (const user of activeUsers) {
    await UserModel.findByIdAndUpdate(String(user._id), {
      $inc: { drawsEntered: 1 },
    });
  }

  // Calculate per-winner amounts based on tier totals and winner counts
  const match5PerWinner = result.tierOutcomes.match5.winners.length > 0 ? tierAmounts.match5 / result.tierOutcomes.match5.winners.length : 0;
  const match4PerWinner = result.tierOutcomes.match4.winners.length > 0 ? tierAmounts.match4 / result.tierOutcomes.match4.winners.length : 0;
  const match3PerWinner = result.tierOutcomes.match3.winners.length > 0 ? tierAmounts.match3 / result.tierOutcomes.match3.winners.length : 0;

  const winnerRecords = [
    ...result.tierOutcomes.match5.winners.map((winner) => ({
      userId: winner.userId,
      userName: winner.userName,
      tier: "match5" as const,
      amount: match5PerWinner,
      paymentStatus: "pending" as const,
      verificationStatus: "pending" as const,
      proofUploaded: false,
      drawMonth: draw.drawMonth,
    })),
    ...result.tierOutcomes.match4.winners.map((winner) => ({
      userId: winner.userId,
      userName: winner.userName,
      tier: "match4" as const,
      amount: match4PerWinner,
      paymentStatus: "pending" as const,
      verificationStatus: "pending" as const,
      proofUploaded: false,
      drawMonth: draw.drawMonth,
    })),
    ...result.tierOutcomes.match3.winners.map((winner) => ({
      userId: winner.userId,
      userName: winner.userName,
      tier: "match3" as const,
      amount: match3PerWinner,
      paymentStatus: "pending" as const,
      verificationStatus: "pending" as const,
      proofUploaded: false,
      drawMonth: draw.drawMonth,
    })),
  ];

  if (winnerRecords.length > 0) {
    // Process each winner - deduct charity contribution and record donation
    for (const winnerRecord of winnerRecords) {
      // Get user to find charity preference
      const user = await UserModel.findById(winnerRecord.userId).lean();

      if (user) {
        const charityPercent = user.charityContributionPercent || 10;
        const charityAmount = (winnerRecord.amount * charityPercent) / 100;
        const userAmount = winnerRecord.amount - charityAmount;

        // Update winning record with deducted amount
        winnerRecord.amount = userAmount;

        // Record charity donation
        if (charityAmount > 0 && user.charityId) {
          await CharityModel.findByIdAndUpdate(user.charityId, {
            $inc: {
              totalDonations: charityAmount,
            },
          });
        }
      }
    }

    // Insert winning records with deducted amounts
    await WinningModel.insertMany(winnerRecords);

    // Update user winnings with net amounts (after charity deduction)
    for (const winner of winnerRecords) {
      await UserModel.findByIdAndUpdate(winner.userId, {
        $inc: {
          "winnings.totalWon": winner.amount,
          "winnings.pendingAmount": winner.amount,
        },
      });
    }

    // Send winner notification emails
    for (const winner of winnerRecords) {
      const user = await UserModel.findById(winner.userId).lean();
      if (user && user.email) {
        await sendWinnerNotificationEmail(user.email, user.name, winner.tier, winner.amount, draw.drawMonth);
      }
    }
  }

  // Send draw published notification to all active users
  const allUsers = await UserModel.find({ "subscription.status": "active" }).lean();
  for (const user of allUsers) {
    if (user.email) {
      await sendDrawPublishedEmail(user.email, draw.drawMonth);
    }
  }

  return { draw, result };
}
