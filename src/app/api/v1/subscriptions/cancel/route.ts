import { getCurrentAppUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { successResponse, errorResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";
import { createStripeServerClient } from "@/lib/services/subscription.service";

export async function POST() {
  const user = await getCurrentAppUser();

  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  if (!user.subscription.stripeSubscriptionId || !process.env.STRIPE_SECRET_KEY) {
    await connectToDatabase();
    await UserModel.findByIdAndUpdate(user.id, {
      $set: {
        "subscription.cancelAtPeriodEnd": true,
      },
    });

    return successResponse(
      {
        status: user.subscription.status,
        cancelAtPeriodEnd: true,
      },
      "Subscription cancellation updated",
    );
  }

  const stripe = createStripeServerClient();
  const updated = await stripe.subscriptions.update(
    user.subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: true,
    },
  );

  await connectToDatabase();
  await UserModel.findByIdAndUpdate(user.id, {
    $set: {
      "subscription.cancelAtPeriodEnd": true,
      "subscription.status":
        updated.status === "active"
          ? "active"
          : updated.status === "past_due"
            ? "lapsed"
            : "inactive",
    },
  });

  return successResponse(
    {
      status:
        updated.status === "active"
          ? "active"
          : updated.status === "past_due"
            ? "lapsed"
            : "inactive",
      cancelAtPeriodEnd: true,
    },
    "Subscription cancellation updated",
  );
}
