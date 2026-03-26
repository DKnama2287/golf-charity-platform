import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { ScoreModel } from "@/lib/models/score";
import { toPlainObject } from "@/lib/serializers";

const schema = z.object({
  score: z.number().int().min(1).max(45),
  playedAt: z.iso.date(),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string; scoreId: string }> },
) {
  const auth = await requireAdminUser();

  if (auth.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (auth.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return errorResponse("Invalid score payload.", 400, parsed.error.flatten());
  }

  const { userId, scoreId } = await context.params;
  await connectToDatabase();

  const score = await ScoreModel.findOneAndUpdate(
    { _id: scoreId, userId },
    {
      $set: {
        score: parsed.data.score,
        playedAt: parsed.data.playedAt,
      },
    },
    { new: true },
  ).lean();

  if (!score) {
    return errorResponse("Score not found.", 404);
  }

  const scores = await ScoreModel.find({ userId })
    .sort({ playedAt: -1, createdAt: -1 })
    .lean();

  return successResponse(
    toPlainObject({
      score,
      scores,
    }),
    "Score updated successfully",
  );
}
