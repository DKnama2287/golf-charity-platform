import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import {
  ensureAdminAccountExists,
  normalizeUserEmail,
} from "@/lib/auth/server";
import { createSessionToken } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { successResponse, errorResponse } from "@/lib/http";
import { CharityModel } from "@/lib/models/charity";
import { UserModel } from "@/lib/models/user";
import { sendAccountVerificationEmail } from "@/lib/services/email.service";

const schema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
  charityId: z.string().trim().min(1),
  contributionPercent: z.coerce.number().min(10).max(100).default(10),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid signup payload.", 400, parsed.error.flatten());
  }

  await ensureAdminAccountExists();
  await connectToDatabase();

  const email = normalizeUserEmail(parsed.data.email);
  const charity = await CharityModel.findById(parsed.data.charityId).lean();

  if (!charity) {
    return errorResponse("Please select a valid charity during signup.", 400);
  }

  const existingUser = await UserModel.findOne({ email }).lean();

  if (existingUser) {
    return errorResponse("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await UserModel.create({
    name: parsed.data.fullName,
    email,
    passwordHash,
    role: "user",
    charityId: parsed.data.charityId,
    charityContributionPercent: parsed.data.contributionPercent,
  });

  const sessionToken = await createSessionToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name,
  });

  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  // Send welcome email
  await sendAccountVerificationEmail(user.email, user.name);

  return successResponse(
    {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.name,
        role: "user",
      },
    },
    "User created successfully",
    201,
  );
}
