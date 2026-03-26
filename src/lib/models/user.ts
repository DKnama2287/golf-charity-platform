import { Schema, model, models, type InferSchemaType } from "mongoose";

const subscriptionSchema = new Schema(
  {
    plan: {
      type: String,
      enum: ["monthly", "yearly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "lapsed", "cancelled"],
      default: "inactive",
    },
    renewalDate: {
      type: String,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
    monthlyPrice: {
      type: Number,
      default: 19,
    },
    yearlyPrice: {
      type: Number,
      default: 149,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
      default: "",
    },
    stripeSubscriptionId: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const winningsSchema = new Schema(
  {
    totalWon: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    handicap: { type: Number, default: 18 },
    charityId: { type: String, default: "" },
    charityContributionPercent: { type: Number, min: 10, max: 100, default: 10 },
    drawsEntered: { type: Number, default: 0 },
    upcomingDraws: { type: Number, default: 1 },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },
    winnings: {
      type: winningsSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

export type MongoUser = InferSchemaType<typeof userSchema> & { _id: string };

export const UserModel = models.User || model("User", userSchema);
