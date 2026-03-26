import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { successResponse, errorResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
});

export async function GET() {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  return successResponse({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    charityId: user.charityId,
    charityContributionPercent: user.charityContributionPercent,
    subscription: user.subscription,
    drawsEntered: user.drawsEntered,
    upcomingDraws: user.upcomingDraws,
    winnings: user.winnings,
  });
}

export async function PATCH(request: Request) {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid profile payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const existingUser = await UserModel.findOne({
    email: parsed.data.email.toLowerCase(),
    _id: { $ne: user.id },
  }).lean();

  if (existingUser) {
    return errorResponse("That email is already in use.", 409);
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    user.id,
    {
      $set: {
        name: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
      },
    },
    { new: true },
  ).lean();

  if (!updatedUser) {
    return errorResponse("User not found.", 404);
  }

  return successResponse(
    {
      id: String(updatedUser._id),
      email: updatedUser.email,
      fullName: updatedUser.name,
      role: updatedUser.role,
    },
    "Profile updated successfully",
  );
}
