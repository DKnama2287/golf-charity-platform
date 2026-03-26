import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { ScoreModel } from "@/lib/models/score";
import { UserModel } from "@/lib/models/user";
import { WinningModel } from "@/lib/models/winning";
import { toPlainObject } from "@/lib/serializers";

const schema = z.object({
  name: z.string().min(2).optional(),
  email: z.email().optional(),
  role: z.enum(["user", "admin"]).optional(),
  subscriptionPlan: z.enum(["monthly", "yearly"]).optional(),
  subscriptionStatus: z.enum(["active", "inactive", "lapsed", "cancelled"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const result = await requireAdminUser();

  if (result.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (result.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  const { userId } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid user update payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.email !== undefined ? { email: parsed.data.email.toLowerCase() } : {}),
      ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),
      ...(parsed.data.subscriptionPlan !== undefined
        ? { "subscription.plan": parsed.data.subscriptionPlan }
        : {}),
      ...(parsed.data.subscriptionStatus !== undefined
        ? { "subscription.status": parsed.data.subscriptionStatus }
        : {}),
    },
    { new: true, projection: { passwordHash: 0 } },
  ).lean();

  if (!updatedUser) {
    return errorResponse("User not found.", 404);
  }

  return successResponse(toPlainObject(updatedUser), "User updated successfully");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const result = await requireAdminUser();

  if (result.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (result.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  const { userId } = await params;
  await connectToDatabase();

  const [user, scores, winnings] = await Promise.all([
    UserModel.findById(userId, { passwordHash: 0 }).lean(),
    ScoreModel.find({ userId }).sort({ playedAt: -1, createdAt: -1 }).lean(),
    WinningModel.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!user) {
    return errorResponse("User not found.", 404);
  }

  return successResponse(
    toPlainObject({
      user,
      scores,
      winnings,
    }),
  );
}
