import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdminUser, normalizeUserEmail } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";

const schema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const auth = await requireAdminUser();

  if (auth.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (auth.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid admin creation payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const email = normalizeUserEmail(parsed.data.email);
  const existingUser = await UserModel.findOne({ email }).lean();

  if (existingUser) {
    return errorResponse("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const admin = await UserModel.create({
    name: parsed.data.fullName,
    email,
    passwordHash,
    role: "admin",
    charityContributionPercent: 10,
    subscription: {
      plan: "yearly",
      status: "active",
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      monthlyPrice: 19,
      yearlyPrice: 149,
      cancelAtPeriodEnd: false,
      stripeCustomerId: "",
      stripeSubscriptionId: "",
    },
    winnings: {
      totalWon: 0,
      pendingAmount: 0,
      paidAmount: 0,
    },
  });

  return successResponse(
    {
      id: admin._id.toString(),
      email: admin.email,
      fullName: admin.name,
      role: admin.role,
    },
    "Admin account created successfully.",
    201,
  );
}
