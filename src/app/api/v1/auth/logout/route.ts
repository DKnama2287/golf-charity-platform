import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { successResponse } from "@/lib/http";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  return successResponse({}, "Logged out successfully");
}
