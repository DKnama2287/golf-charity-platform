import { Schema, model, models } from "mongoose";

const charitySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    region: { type: String, default: "Global" },
    description: { type: String, default: "" },
    impactMetric: { type: String, default: "" },
    upcomingEvent: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    websiteUrl: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    countryCode: { type: String, default: "" },
    totalDonations: { type: Number, default: 0 },
    supporterCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const CharityModel = models.Charity || model("Charity", charitySchema);
