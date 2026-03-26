import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import {
  ensureAdminAccountExists,
  getUserByEmail,
  normalizeUserEmail,
} from "@/lib/auth/server";
import { createSessionToken } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/http";

const schema = z.object({
  email: z.email(),
  password: z.string().min(6),
  roleRequested: z.enum(["user", "admin"]).optional().default("user"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid login payload.", 400, parsed.error.flatten());
  }

  const cookieStore = await cookies();
  await ensureAdminAccountExists();
  const user = await getUserByEmail(normalizeUserEmail(parsed.data.email));

  if (!user) {
    return errorResponse("Invalid email or password.", 401);
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return errorResponse("Invalid email or password.", 401);
  }

  if (parsed.data.roleRequested === "admin" && user.role !== "admin") {
    return errorResponse("This account does not have admin access.", 403);
  }

  const sessionToken = await createSessionToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  cookieStore.set(ACCESS_TOKEN_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return successResponse(
    {
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    },
    "Login successful",
  );
}
