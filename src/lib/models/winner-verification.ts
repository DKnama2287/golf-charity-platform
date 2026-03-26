import { Schema, model, models } from "mongoose";

const winnerVerificationSchema = new Schema(
  {
    winningId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    proofFileUrl: { type: String, default: "" },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: String, default: null },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true },
);

export const WinnerVerificationModel =
  models.WinnerVerification || model("WinnerVerification", winnerVerificationSchema);
