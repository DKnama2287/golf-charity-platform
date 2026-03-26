import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CharityModel } from "@/lib/models/charity";
import { DrawModel } from "@/lib/models/draw";
import { UserModel } from "@/lib/models/user";
import { WinningModel } from "@/lib/models/winning";
import { WinnerVerificationModel } from "@/lib/models/winner-verification";
import { successResponse } from "@/lib/http";
import { errorResponse } from "@/lib/http";

export async function GET() {
  const result = await requireAdminUser();

  if (result.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (result.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  await connectToDatabase();
  const [users, charities, pendingVerifications, draws, winnings] = await Promise.all([
    UserModel.find().lean(),
    CharityModel.find().lean(),
    WinnerVerificationModel.countDocuments({
      status: "pending",
    }),
    DrawModel.find().lean(),
    WinningModel.find().lean(),
  ]);

  const activeSubscribers = users.filter((user) => user.subscription?.status === "active");
  const totalRevenue = activeSubscribers.reduce((sum, user) => {
    const amount =
      user.subscription?.plan === "yearly"
        ? user.subscription?.yearlyPrice ?? 0
        : user.subscription?.monthlyPrice ?? 0;

    return sum + amount;
  }, 0);

  // Include jackpot rollover from latest draw
  const latestPublishedDraw = draws
    .filter((d) => d.published && !d.isSimulation)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const previousJackpot = latestPublishedDraw?.nextJackpotRollover ?? 0;
  const totalPrizePool = totalRevenue + previousJackpot;

  const charityContributionTotal = charities.reduce(
    (sum, charity) => sum + (charity.totalDonations ?? 0),
    0,
  );

  const publishedDraws = draws.filter((draw) => draw.published && !draw.isSimulation);
  const simulationRuns = draws.filter((draw) => draw.isSimulation).length;
  const readyToPublish = draws.filter((draw) => !draw.isSimulation && !draw.published).length;
  const totalWinners = winnings.length;

  return successResponse({
    totalUsers: users.length,
    activeSubscribers: activeSubscribers.length,
    totalPrizePool,
    charityContributionTotal,
    pendingVerifications,
    drawStats: {
      totalDraws: draws.length,
      publishedDraws: publishedDraws.length,
      simulationRuns,
      readyToPublish,
      totalWinners,
    },
  });
}
