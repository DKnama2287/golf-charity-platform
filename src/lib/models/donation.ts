import { Schema, model, models } from "mongoose";

const donationSchema = new Schema(
  {
    charityId: { type: String, required: true, index: true },
    userId: { type: String, default: "" },
    donorName: { type: String, default: "" },
    donorEmail: { type: String, default: "" },
    amount: { type: Number, required: true, min: 1 },
    source: {
      type: String,
      enum: ["independent", "subscription"],
      default: "independent",
    },
    sourceReference: { type: String, default: "", index: true },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

export const DonationModel = models.Donation || model("Donation", donationSchema);
