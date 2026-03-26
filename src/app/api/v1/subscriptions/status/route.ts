import { getCurrentAppUser } from "@/lib/auth/server";
import { successResponse, errorResponse } from "@/lib/http";

export async function GET() {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  return successResponse(user.subscription);
}
