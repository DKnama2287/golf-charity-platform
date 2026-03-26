import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { successResponse, errorResponse } from "@/lib/http";
import { buildCharityContributionRecord } from "@/lib/services/charity.service";
import { CharityModel } from "@/lib/models/charity";
import { UserModel } from "@/lib/models/user";

const schema = z.object({
  charityId: z.string().min(1),
  contributionPercent: z.number().min(10).max(100).optional(),
  subscriptionAmount: z.number().min(0).default(19),
});

export async function POST(request: Request) {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("Invalid charity selection payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const charity = await CharityModel.findById(parsed.data.charityId).lean();

  if (!charity) {
    return errorResponse("Charity not found.", 404);
  }

  const record = buildCharityContributionRecord({
    userId: user.id,
    charityId: parsed.data.charityId,
    subscriptionAmount: parsed.data.subscriptionAmount,
    customPercent: parsed.data.contributionPercent,
  });

  await UserModel.findByIdAndUpdate(user.id, {
    $set: {
      charityId: parsed.data.charityId,
      charityContributionPercent: record.contributionPercent,
    },
  });

  return successResponse(record, "Charity selection updated");
}
