import { z } from "zod";
import { getCurrentAppUser, requireActiveSubscription } from "@/lib/auth/server";
import { successResponse, errorResponse } from "@/lib/http";
import { getLatestFiveScores, saveUserScoreAndGetLatestFive } from "@/lib/services/score.service";

const schema = z.object({
  score: z.number().int().min(1).max(45),
  playedAt: z.iso.date(),
});

export async function GET() {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  const scores = await getLatestFiveScores(user.id);
  return successResponse(scores);
}

export async function POST(request: Request) {
  const subscriptionAccess = await requireActiveSubscription();

  if (subscriptionAccess.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (subscriptionAccess.error === "inactive_subscription") {
    return errorResponse("An active subscription is required to add scores.", 403);
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("Invalid score payload.", 400, parsed.error.flatten());
  }

  const scores = await saveUserScoreAndGetLatestFive({
    userId: subscriptionAccess.user.id,
    score: parsed.data.score,
    playedAt: parsed.data.playedAt,
  });

  return successResponse(
    {
      scoreId: scores[0]?.id ?? null,
      last5Scores: scores,
    },
    "Score added successfully",
    201,
  );
}
