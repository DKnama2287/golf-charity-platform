import { Schema, model, models } from "mongoose";

const drawSchema = new Schema(
  {
    mode: { type: String, enum: ["random", "weighted"], required: true },
    drawMonth: { type: String, required: true, index: true, default: () => new Date().toISOString().slice(0, 7) },
    numbers: [{ type: Number, required: true }],
    isSimulation: { type: Boolean, default: true },
    published: { type: Boolean, default: false },
    publishedAt: { type: String, default: "" },
    previousJackpotRollover: { type: Number, default: 0 },
    nextJackpotRollover: { type: Number, default: 0 },
    prizePoolAmount: { type: Number, default: 0 },
    participantCount: { type: Number, default: 0 },
    winners: {
      match5: { type: Number, default: 0 },
      match4: { type: Number, default: 0 },
      match3: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const DrawModel = models.Draw || model("Draw", drawSchema);
