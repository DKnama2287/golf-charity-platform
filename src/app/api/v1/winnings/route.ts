import { getCurrentAppUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { WinningModel } from "@/lib/models/winning";
import { WinnerVerificationModel } from "@/lib/models/winner-verification";
import { toPlainObject } from "@/lib/serializers";

export async function GET() {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  await connectToDatabase();

  const winnings = await WinningModel.find({ userId: user.id })
    .sort({ createdAt: -1 })
    .lean();

  if (winnings.length === 0) {
    return successResponse([]);
  }

  const winningIds = winnings.map((winning) => String(winning._id));
  const verifications = await WinnerVerificationModel.find({
    winningId: { $in: winningIds },
  }).lean();

  const verificationMap = new Map(
    verifications.map((verification) => [verification.winningId, verification]),
  );

  const result = winnings.map((winning) => ({
    ...winning,
    verification: verificationMap.get(String(winning._id)) ?? null,
  }));

  return successResponse(toPlainObject(result));
}
