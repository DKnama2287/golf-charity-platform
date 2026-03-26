export type SubscriptionPlan = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "inactive" | "lapsed" | "cancelled";
export type DrawMode = "random" | "weighted";
export type MatchTier = "match5" | "match4" | "match3";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type PaymentStatus = "pending" | "paid";

export interface ScoreEntry {
  id: string;
  value: number;
  date: string;
}

export interface StoredScore {
  id: string;
  userId: string;
  score: number;
  playedAt: string;
  createdAt?: string;
}

export interface Charity {
  id: string;
  name: string;
  category: string;
  region: string;
  description: string;
  impactMetric: string;
  upcomingEvent: string;
  featured: boolean;
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  renewalDate: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

export interface WinningsSummary {
  totalWon: number;
  pendingAmount: number;
  paidAmount: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  handicap: number;
  subscription: Subscription;
  charityId: string;
  charityContributionPercent: number;
  scores: ScoreEntry[];
  drawsEntered: number;
  upcomingDraws: number;
  winnings: WinningsSummary;
}

export interface DrawResult {
  id: string;
  month: string;
  mode: DrawMode;
  numbers: number[];
  published: boolean;
  jackpotRollover: number;
}

export interface WinnerRecord {
  id: string;
  userId: string;
  userName: string;
  tier: MatchTier;
  amount: number;
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  proofUploaded: boolean;
}

export interface PrizePoolBreakdown {
  totalPool: number;
  charityTotal: number;
  tiers: Record<MatchTier, number>;
}

export interface PrizePoolTierSplit {
  tier: MatchTier;
  percent: number;
  poolAmount: number;
  winnerCount: number;
  payoutPerWinner: number;
  rolloverAmount: number;
}

export interface PrizePoolDistribution {
  totalRevenue: number;
  previousJackpotRollover: number;
  totalPrizePool: number;
  nextJackpotRollover: number;
  splits: Record<MatchTier, PrizePoolTierSplit>;
}

export interface DrawParticipantInput {
  userId: string;
  userName: string;
  scores: number[];
}

export interface DrawMatchResult {
  userId: string;
  userName: string;
  matchedNumbers: number[];
  matchCount: number;
  tier: MatchTier | null;
}

export interface DrawTierOutcome {
  tier: MatchTier;
  winners: DrawMatchResult[];
  poolAmount: number;
  payoutPerWinner: number;
  rolloverAmount: number;
}

export interface DrawExecutionResult {
  numbers: number[];
  mode: DrawMode;
  isSimulation: boolean;
  previousJackpotRollover: number;
  nextJackpotRollover: number;
  results: DrawMatchResult[];
  tierOutcomes: Record<MatchTier, DrawTierOutcome>;
}

export interface CharityContributionInput {
  userId: string;
  charityId: string;
  subscriptionAmount: number;
  customPercent?: number;
}

export interface CharityContributionRecord {
  userId: string;
  charityId: string;
  contributionPercent: number;
  donationAmount: number;
}

export interface CharityDonationSummary {
  charityId: string;
  totalDonations: number;
  supporterCount: number;
}
