import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { WinnerVerificationModel } from "@/lib/models/winner-verification";
import { WinningModel } from "@/lib/models/winning";
import { toPlainObject } from "@/lib/serializers";

async function requireAdmin() {
  const result = await requireAdminUser();
  if (result.error === "unauthorized") {
    return { error: errorResponse("Unauthorized", 401) };
  }
  if (result.error === "forbidden") {
    return { error: errorResponse("Forbidden", 403) };
  }
  return result;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await connectToDatabase();
  const verifications = await WinnerVerificationModel.find()
    .sort({ createdAt: -1 })
    .lean();

  const winningIds = verifications.map((verification) => verification.winningId);
  const winnings = await WinningModel.find({
    _id: { $in: winningIds },
  }).lean();
  const winningMap = new Map(winnings.map((winning) => [String(winning._id), winning]));

  const result = verifications.map((verification) => ({
    ...verification,
    winning: winningMap.get(verification.winningId) ?? null,
  }));

  return successResponse(toPlainObject(result));
}
