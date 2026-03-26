import type {
  Charity,
  DrawMode,
  DrawResult,
  MatchTier,
  PrizePoolBreakdown,
  ScoreEntry,
  UserProfile,
  WinnerRecord,
} from "@/lib/types";

const SCORE_MIN = 1;
const SCORE_MAX = 45;
const MAX_STORED_SCORES = 5;

export function clampScore(value: number) {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
}

export function insertRollingScore(
  scores: ScoreEntry[],
  newScore: Omit<ScoreEntry, "id">,
) {
  const nextScore: ScoreEntry = {
    ...newScore,
    id: `${newScore.date}-${newScore.value}`,
    value: clampScore(newScore.value),
  };

  const sorted = [...scores, nextScore].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return sorted.slice(0, MAX_STORED_SCORES);
}

export function getStablefordFrequency(users: UserProfile[]) {
  const frequency = new Map<number, number>();

  users.forEach((user) => {
    user.scores.forEach((score) => {
      frequency.set(score.value, (frequency.get(score.value) ?? 0) + 1);
    });
  });

  return frequency;
}

export function buildWeightedDrawNumbers(users: UserProfile[]) {
  const frequency = getStablefordFrequency(users);
  const candidates = Array.from({ length: SCORE_MAX }, (_, index) => index + 1);
  const ranked = candidates.sort((a, b) => {
    const frequencyGap = (frequency.get(b) ?? 0) - (frequency.get(a) ?? 0);
    if (frequencyGap !== 0) {
      return frequencyGap;
    }
    return a - b;
  });

  return ranked.slice(0, 5).sort((a, b) => a - b);
}

export function buildRandomDrawNumbers(seedOffset = 0) {
  const numbers = new Set<number>();
  let cursor = 11 + seedOffset * 7;

  while (numbers.size < 5) {
    cursor = (cursor * 17 + 23) % SCORE_MAX;
    numbers.add(cursor + 1);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

export function generateDrawPreview(
  users: UserProfile[],
  mode: DrawMode,
): DrawResult {
  return {
    id: `draw-${mode}`,
    month: "March 2026",
    mode,
    numbers:
      mode === "weighted" ? buildWeightedDrawNumbers(users) : buildRandomDrawNumbers(3),
    published: false,
    jackpotRollover: 1800,
  };
}

export function calculatePrizePool(users: UserProfile[]): PrizePoolBreakdown {
  const totalPool = users.reduce((sum, user) => {
    return sum + (user.subscription.plan === "yearly" ? 149 : 19);
  }, 0);

  const charityTotal = users.reduce((sum, user) => {
    const basePrice = user.subscription.plan === "yearly" ? 149 : 19;
    return sum + basePrice * (user.charityContributionPercent / 100);
  }, 0);

  return {
    totalPool,
    charityTotal,
    tiers: {
      match5: totalPool * 0.4,
      match4: totalPool * 0.35,
      match3: totalPool * 0.25,
    },
  };
}

export function countMatches(user: UserProfile, drawNumbers: number[]) {
  const values = new Set(user.scores.map((score) => score.value));
  return drawNumbers.filter((number) => values.has(number)).length;
}

export function tierFromMatchCount(matchCount: number): MatchTier | null {
  if (matchCount >= 5) {
    return "match5";
  }
  if (matchCount === 4) {
    return "match4";
  }
  if (matchCount === 3) {
    return "match3";
  }
  return null;
}

export function buildWinners(
  users: UserProfile[],
  draw: DrawResult,
): WinnerRecord[] {
  const pools = calculatePrizePool(users);
  const grouped = new Map<MatchTier, UserProfile[]>();

  users.forEach((user) => {
    const tier = tierFromMatchCount(countMatches(user, draw.numbers));
    if (!tier) {
      return;
    }
    grouped.set(tier, [...(grouped.get(tier) ?? []), user]);
  });

  return (["match5", "match4", "match3"] as MatchTier[]).flatMap((tier) => {
    const winners = grouped.get(tier) ?? [];
    if (winners.length === 0) {
      return [];
    }

    const amount = pools.tiers[tier] / winners.length;
    return winners.map((winner, index) => ({
      id: `${draw.id}-${tier}-${winner.id}-${index}`,
      userId: winner.id,
      userName: winner.name,
      tier,
      amount,
      paymentStatus: tier === "match3" ? "paid" : "pending",
      verificationStatus: tier === "match4" ? "pending" : "approved",
      proofUploaded: tier !== "match3",
    }));
  });
}

export function getFeaturedCharities(charities: Charity[]) {
  return charities.filter((charity) => charity.featured);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value}%`;
}

export function formatTierLabel(tier: MatchTier) {
  if (tier === "match5") {
    return "5-Number Match";
  }
  if (tier === "match4") {
    return "4-Number Match";
  }
  return "3-Number Match";
}
