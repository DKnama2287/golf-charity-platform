import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/constants";
import { verifySessionToken, type SessionPayload } from "@/lib/auth/jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { UserModel } from "@/lib/models/user";
import { ensureBootstrapData } from "@/lib/services/bootstrap.service";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  charityId: string;
  charityContributionPercent: number;
  subscription: {
    plan: "monthly" | "yearly";
    status: "active" | "inactive" | "lapsed" | "cancelled";
    renewalDate: string;
    monthlyPrice: number;
    yearlyPrice: number;
    cancelAtPeriodEnd?: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
  drawsEntered: number;
  upcomingDraws: number;
  winnings: {
    totalWon: number;
    pendingAmount: number;
    paidAmount: number;
  };
}

function adminEnvConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function mapUserDocument(user: {
  _id: { toString(): string };
  email: string;
  name: string;
  role: "user" | "admin";
  charityId?: string;
  charityContributionPercent?: number;
  subscription?: AppUser["subscription"];
  drawsEntered?: number;
  upcomingDraws?: number;
  winnings?: AppUser["winnings"];
}) {
  return {
    id: user._id.toString(),
    email: user.email,
    full_name: user.name,
    role: user.role,
    charityId: user.charityId ?? "",
    charityContributionPercent: user.charityContributionPercent ?? 10,
    subscription: user.subscription ?? {
      plan: "monthly",
      status: "inactive",
      renewalDate: new Date().toISOString().slice(0, 10),
      monthlyPrice: 19,
      yearlyPrice: 149,
      cancelAtPeriodEnd: false,
      stripeCustomerId: "",
      stripeSubscriptionId: "",
    },
    drawsEntered: user.drawsEntered ?? 0,
    upcomingDraws: user.upcomingDraws ?? 1,
    winnings: user.winnings ?? {
      totalWon: 0,
      pendingAmount: 0,
      paidAmount: 0,
    },
  } satisfies AppUser;
}

export function isSupabaseConfigured() {
  return false;
}

export async function getAccessTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function ensureAdminAccountExists() {
  await ensureBootstrapData();

  if (!adminEnvConfigured()) {
    return null;
  }

  await connectToDatabase();

  const email = normalizeEmail(process.env.ADMIN_EMAIL!);
  const existingAdmin = await UserModel.findOne({ email }).lean();

  if (existingAdmin) {
    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);

  const createdAdmin = await UserModel.create({
    name: "Platform Admin",
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

  return createdAdmin.toObject();
}

export async function getCurrentUserFromSession(): Promise<SessionPayload | null> {
  const token = await getAccessTokenFromCookies();

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getCurrentAppUser() {
  await ensureAdminAccountExists();

  const sessionUser = await getCurrentUserFromSession();

  if (!sessionUser) {
    return null;
  }

  await connectToDatabase();
  const user = await UserModel.findById(sessionUser.sub).lean();

  if (!user) {
    return null;
  }

  return mapUserDocument(user);
}

export async function requireAdminUser() {
  const user = await getCurrentAppUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  if (user.role !== "admin") {
    return { error: "forbidden" as const };
  }

  return { user };
}

export async function requireActiveSubscription() {
  const user = await getCurrentAppUser();

  if (!user) {
    return { error: "unauthorized" as const };
  }

  if (user.role !== "admin" && user.subscription.status !== "active") {
    return { error: "inactive_subscription" as const, user };
  }

  return { user };
}

export async function getUserByEmail(email: string) {
  await ensureAdminAccountExists();
  await connectToDatabase();
  return UserModel.findOne({ email: normalizeEmail(email) });
}

export function normalizeUserEmail(email: string) {
  return normalizeEmail(email);
}
