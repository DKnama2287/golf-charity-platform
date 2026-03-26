import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { WinningModel } from "@/lib/models/winning";
import { toPlainObject } from "@/lib/serializers";

export async function GET() {
  const auth = await requireAdminUser();

  if (auth.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (auth.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  await connectToDatabase();
  const winnings = await WinningModel.find().sort({ createdAt: -1 }).lean();
  return successResponse(toPlainObject(winnings));
}
