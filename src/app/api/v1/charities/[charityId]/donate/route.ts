import { z } from "zod";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { CharityModel } from "@/lib/models/charity";
import { DonationModel } from "@/lib/models/donation";

const schema = z.object({
  donorName: z.string().optional().default(""),
  donorEmail: z.string().optional().default(""),
  amount: z.number().positive(),
  note: z.string().optional().default(""),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ charityId: string }> },
) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid donation payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const { charityId } = await context.params;
  const charity = await CharityModel.findById(charityId);

  if (!charity) {
    return errorResponse("Charity not found.", 404);
  }

  await DonationModel.create({
    charityId,
    donorName: parsed.data.donorName,
    donorEmail: parsed.data.donorEmail,
    amount: parsed.data.amount,
    note: parsed.data.note,
    source: "independent",
  });

  charity.totalDonations = (charity.totalDonations ?? 0) + parsed.data.amount;
  await charity.save();

  return successResponse(
    {
      charityId,
      amount: parsed.data.amount,
    },
    "Independent donation recorded successfully.",
    201,
  );
}
