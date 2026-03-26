import { connectToDatabase } from "@/lib/db/mongodb";
import { successResponse } from "@/lib/http";
import { DrawModel } from "@/lib/models/draw";
import { UserModel } from "@/lib/models/user";
import { calculatePrizePoolDistribution } from "@/lib/services/prize-pool.service";

export async function GET() {
  await connectToDatabase();

  const [users, latestPublishedDraw] = await Promise.all([
    UserModel.find().lean(),
    DrawModel.findOne({ published: true, isSimulation: false })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const activeSubscribers = users.filter((user) => user.subscription?.status === "active");
  const totalRevenue = activeSubscribers.reduce((sum, user) => {
    const amount =
      user.subscription?.plan === "yearly"
        ? user.subscription?.yearlyPrice ?? 0
        : user.subscription?.monthlyPrice ?? 0;
    return sum + amount;
  }, 0);

  const distribution = calculatePrizePoolDistribution({
    totalRevenue,
    previousJackpotRollover: latestPublishedDraw?.nextJackpotRollover ?? 0,
  });

  // Always use calculated distribution - no custom config
  const tierAmounts = {
    match5: distribution.splits.match5.poolAmount,
    match4: distribution.splits.match4.poolAmount,
    match3: distribution.splits.match3.poolAmount,
  };

  // Use distribution.totalPrizePool which includes everything (revenue + rollover)
  const totalPoolAmount = distribution.totalPrizePool;

  return successResponse({
    activeSubscriberCount: activeSubscribers.length,
    totalRevenue,
    previousJackpotRollover: latestPublishedDraw?.nextJackpotRollover ?? 0,
    totalPrizePool: totalPoolAmount,
    nextJackpotRollover: distribution.nextJackpotRollover,
    tiers: tierAmounts,
    poolDistribution: {
      "match5": { percentage: 40, rollover: true },
      "match4": { percentage: 35, rollover: false },
      "match3": { percentage: 25, rollover: false },
    },
  });
}
