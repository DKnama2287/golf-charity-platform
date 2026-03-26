import { connectToDatabase } from "@/lib/db/mongodb";
import { ScoreModel } from "@/lib/models/score";
import type { StoredScore } from "@/lib/types";

interface SaveScoreInput {
  userId: string;
  score: number;
  playedAt: string;
}

function mapStoredScore(record: {
  _id: { toString(): string };
  userId: string;
  score: number;
  playedAt: string;
  createdAt?: Date;
}) {
  return {
    id: record._id.toString(),
    userId: record.userId,
    score: record.score,
    playedAt: record.playedAt,
    createdAt: record.createdAt?.toISOString(),
  } satisfies StoredScore;
}

export async function getLatestFiveScores(userId: string) {
  await connectToDatabase();

  const scores = await ScoreModel.find({ userId })
    .sort({ playedAt: -1, createdAt: -1 })
    .limit(5)
    .lean();

  return scores.map(mapStoredScore);
}

export async function saveUserScoreAndGetLatestFive({
  userId,
  score,
  playedAt,
}: SaveScoreInput) {
  if (!Number.isInteger(score) || score < 1 || score > 45) {
    throw new Error("Score must be an integer between 1 and 45.");
  }

  await connectToDatabase();

  await ScoreModel.create({
    userId,
    score,
    playedAt,
  });

  const existing = await ScoreModel.find({ userId })
    .sort({ playedAt: -1, createdAt: -1 })
    .lean();

  if (existing.length > 5) {
    const idsToRemove = existing.slice(5).map((entry) => entry._id);

    await ScoreModel.deleteMany({
      _id: { $in: idsToRemove },
    });
  }

  return getLatestFiveScores(userId);
}
