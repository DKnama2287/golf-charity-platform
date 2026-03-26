import type { MatchTier, PrizePoolDistribution, PrizePoolTierSplit } from "@/lib/types";

export interface CalculatePrizePoolInput {
  totalRevenue: number;
  previousJackpotRollover?: number;
  winnerCounts?: Partial<Record<MatchTier, number>>;
}

function buildTierSplit(
  tier: MatchTier,
  percent: number,
  poolAmount: number,
  winnerCount: number,
): PrizePoolTierSplit {
  const normalizedWinnerCount = Math.max(0, winnerCount);
  const rolloverAmount =
    tier === "match5" && normalizedWinnerCount === 0 ? poolAmount : 0;
  const payoutPerWinner =
    normalizedWinnerCount > 0 ? poolAmount / normalizedWinnerCount : 0;

  return {
    tier,
    percent,
    poolAmount,
    winnerCount: normalizedWinnerCount,
    payoutPerWinner,
    rolloverAmount,
  };
}

export function calculatePrizePoolDistribution({
  totalRevenue,
  previousJackpotRollover = 0,
  winnerCounts = {},
}: CalculatePrizePoolInput): PrizePoolDistribution {
  if (totalRevenue < 0) {
    throw new Error("Total subscription revenue cannot be negative.");
  }

  if (previousJackpotRollover < 0) {
    throw new Error("Previous jackpot rollover cannot be negative.");
  }

  const match5Pool = totalRevenue * 0.4 + previousJackpotRollover;
  const match4Pool = totalRevenue * 0.35;
  const match3Pool = totalRevenue * 0.25;

  const splits: Record<MatchTier, PrizePoolTierSplit> = {
    match5: buildTierSplit("match5", 40, match5Pool, winnerCounts.match5 ?? 0),
    match4: buildTierSplit("match4", 35, match4Pool, winnerCounts.match4 ?? 0),
    match3: buildTierSplit("match3", 25, match3Pool, winnerCounts.match3 ?? 0),
  };

  return {
    totalRevenue,
    previousJackpotRollover,
    totalPrizePool: totalRevenue + previousJackpotRollover,
    nextJackpotRollover: splits.match5.rolloverAmount,
    splits,
  };
}
