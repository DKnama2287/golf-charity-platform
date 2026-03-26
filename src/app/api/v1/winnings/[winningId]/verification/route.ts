import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { WinningModel } from "@/lib/models/winning";
import { WinnerVerificationModel } from "@/lib/models/winner-verification";
import { toPlainObject } from "@/lib/serializers";

const schema = z.object({
  proofFileUrl: z.string().min(1),
  notes: z.string().optional().default(""),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ winningId: string }> },
) {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { winningId } = await params;
  await connectToDatabase();

  const verification = await WinnerVerificationModel.findOne({
    winningId,
    userId: user.id,
  }).lean();

  return successResponse(toPlainObject(verification));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ winningId: string }> },
) {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const { winningId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid verification payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const winning = await WinningModel.findOne({
    _id: winningId,
    userId: user.id,
  }).lean();

  if (!winning) {
    return errorResponse("Winning not found.", 404);
  }

  if (winning.paymentStatus === "paid") {
    return errorResponse("This winning has already been paid.", 400);
  }

  const verification = await WinnerVerificationModel.findOneAndUpdate(
    {
      winningId,
      userId: user.id,
    },
    {
      $set: {
        userName: winning.userName,
        proofFileUrl: parsed.data.proofFileUrl,
        notes: parsed.data.notes || "Screenshot of scores from the golf platform uploaded.",
        status: "pending",
        rejectionReason: "",
        reviewedAt: null,
        reviewedBy: "",
      },
    },
    {
      upsert: true,
      new: true,
    },
  ).lean();

  await WinningModel.findByIdAndUpdate(winningId, {
    $set: {
      proofUploaded: true,
      verificationStatus: "pending",
    },
  });

  return successResponse(toPlainObject(verification), "Proof uploaded successfully");
}
