import { Schema, model, models } from "mongoose";

const scoreSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    score: { type: Number, required: true, min: 1, max: 45 },
    playedAt: { type: String, required: true },
  },
  { timestamps: true },
);

scoreSchema.index({ userId: 1, playedAt: -1, createdAt: -1 });

export const ScoreModel = models.Score || model("Score", scoreSchema);
