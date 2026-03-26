import type {
  CharityContributionInput,
  CharityContributionRecord,
  CharityDonationSummary,
} from "@/lib/types";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CharityModel } from "@/lib/models/charity";
import { DonationModel } from "@/lib/models/donation";
import { UserModel } from "@/lib/models/user";

export const DEFAULT_CHARITY_CONTRIBUTION_PERCENT = 10;

export function resolveContributionPercent(customPercent?: number) {
  if (customPercent === undefined || customPercent === null) {
    return DEFAULT_CHARITY_CONTRIBUTION_PERCENT;
  }

  if (customPercent < DEFAULT_CHARITY_CONTRIBUTION_PERCENT || customPercent > 100) {
    throw new Error("Custom charity contribution must be between 10 and 100.");
  }

  return customPercent;
}

export function calculateDonationPerSubscription(
  subscriptionAmount: number,
  customPercent?: number,
) {
  if (subscriptionAmount < 0) {
    throw new Error("Subscription amount cannot be negative.");
  }

  const contributionPercent = resolveContributionPercent(customPercent);
  const donationAmount = subscriptionAmount * (contributionPercent / 100);

  return {
    contributionPercent,
    donationAmount,
  };
}

export function buildCharityContributionRecord(
  input: CharityContributionInput,
): CharityContributionRecord {
  const { contributionPercent, donationAmount } = calculateDonationPerSubscription(
    input.subscriptionAmount,
    input.customPercent,
  );

  return {
    userId: input.userId,
    charityId: input.charityId,
    contributionPercent,
    donationAmount,
  };
}

export function summarizeDonationsByCharity(
  contributions: CharityContributionInput[],
): CharityDonationSummary[] {
  const grouped = new Map<string, CharityDonationSummary>();

  contributions.forEach((contribution) => {
    const record = buildCharityContributionRecord(contribution);
    const existing = grouped.get(record.charityId);

    if (!existing) {
      grouped.set(record.charityId, {
        charityId: record.charityId,
        totalDonations: record.donationAmount,
        supporterCount: 1,
      });
      return;
    }

    existing.totalDonations += record.donationAmount;
    existing.supporterCount += 1;
  });

  return Array.from(grouped.values()).sort(
    (left, right) => right.totalDonations - left.totalDonations,
  );
}

export async function recordSubscriptionDonationForUser(
  userId: string,
  sourceReference: string,
) {
  await connectToDatabase();

  const user = await UserModel.findById(userId).lean();

  if (!user?.charityId) {
    return null;
  }

  const charity = await CharityModel.findById(user.charityId);

  if (!charity) {
    return null;
  }

  const subscriptionAmount =
    user.subscription?.plan === "yearly"
      ? user.subscription?.yearlyPrice ?? 0
      : user.subscription?.monthlyPrice ?? 0;

  const record = buildCharityContributionRecord({
    userId,
    charityId: user.charityId,
    subscriptionAmount,
    customPercent: user.charityContributionPercent,
  });

  const existingDonation = await DonationModel.findOne({
    source: "subscription",
    sourceReference,
  }).lean();

  if (existingDonation) {
    return record;
  }

  const priorSupport = await DonationModel.findOne({
    charityId: user.charityId,
    userId,
  }).lean();

  await DonationModel.create({
    charityId: user.charityId,
    userId,
    amount: record.donationAmount,
    source: "subscription",
    sourceReference,
    note: `Subscription contribution at ${record.contributionPercent}%`,
  });

  await CharityModel.findByIdAndUpdate(user.charityId, {
    $inc: {
      totalDonations: record.donationAmount,
      supporterCount: priorSupport ? 0 : 1,
    },
  });

  return record;
}
