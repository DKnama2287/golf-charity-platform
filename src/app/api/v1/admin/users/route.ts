import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { successResponse } from "@/lib/http";
import { errorResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";
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
  const users = await UserModel.find({}, { passwordHash: 0 }).sort({ createdAt: -1 }).lean();
  return successResponse(toPlainObject(users));
}
