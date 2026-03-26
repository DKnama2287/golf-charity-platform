import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { DrawModel } from "@/lib/models/draw";
import { toPlainObject } from "@/lib/serializers";

export async function GET() {
  const result = await requireAdminUser();

  if (result.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (result.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  await connectToDatabase();
  const draws = await DrawModel.find().sort({ createdAt: -1 }).limit(12).lean();
  return successResponse(toPlainObject(draws));
}
