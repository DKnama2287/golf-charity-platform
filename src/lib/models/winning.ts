import { Schema, model, models } from "mongoose";

const winningSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    tier: { type: String, enum: ["match5", "match4", "match3"], required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    proofUploaded: { type: Boolean, default: false },
    drawMonth: { type: String, default: () => new Date().toISOString().slice(0, 7) },
    paidAt: { type: String, default: null },
  },
  { timestamps: true },
);

export const WinningModel = models.Winning || model("Winning", winningSchema);
