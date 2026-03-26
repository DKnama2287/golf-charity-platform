import { z } from "zod";
import { requireActiveSubscription } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { ScoreModel } from "@/lib/models/score";
import { getLatestFiveScores } from "@/lib/services/score.service";

const schema = z.object({
  score: z.number().int().min(1).max(45),
  playedAt: z.iso.date(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ scoreId: string }> },
) {
  const subscriptionAccess = await requireActiveSubscription();

  if (subscriptionAccess.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (subscriptionAccess.error === "inactive_subscription") {
    return errorResponse("An active subscription is required to edit scores.", 403);
  }

  const { scoreId } = await context.params;
  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid score payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();

  const updated = await ScoreModel.findOneAndUpdate(
    { _id: scoreId, userId: subscriptionAccess.user.id },
    {
      $set: {
        score: parsed.data.score,
        playedAt: parsed.data.playedAt,
      },
    },
    { new: true },
  ).lean();

  if (!updated) {
    return errorResponse("Score not found.", 404);
  }

  const latestScores = await getLatestFiveScores(subscriptionAccess.user.id);
  return successResponse(
    {
      scoreId,
      last5Scores: latestScores,
    },
    "Score updated successfully",
  );
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ scoreId: string }> },
) {
  const subscriptionAccess = await requireActiveSubscription();

  if (subscriptionAccess.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (subscriptionAccess.error === "inactive_subscription") {
    return errorResponse("An active subscription is required to delete scores.", 403);
  }

  const { scoreId } = await context.params;
  await connectToDatabase();
  await ScoreModel.findOneAndDelete({ _id: scoreId, userId: subscriptionAccess.user.id });
  const latestScores = await getLatestFiveScores(subscriptionAccess.user.id);

  return successResponse(
    {
      scoreId,
      last5Scores: latestScores,
    },
    "Score deleted successfully",
  );
}
