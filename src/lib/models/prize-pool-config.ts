import { Schema, model, models } from "mongoose";

const prizePoolConfigSchema = new Schema(
  {
    isActive: { type: Boolean, default: true },
    match5Amount: { type: Number, default: 0 },
    match4Amount: { type: Number, default: 0 },
    match3Amount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const PrizePoolConfigModel = models.PrizePoolConfig || model("PrizePoolConfig", prizePoolConfigSchema);

