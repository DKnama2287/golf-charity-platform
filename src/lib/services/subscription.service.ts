import Stripe from "stripe";
import { connectToDatabase } from "@/lib/db/mongodb";
import { UserModel } from "@/lib/models/user";
import { recordSubscriptionDonationForUser } from "@/lib/services/charity.service";

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createStripeServerClient() {
  return new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
}

export async function activateSubscriptionForCheckoutSession(sessionId: string) {
  await connectToDatabase();

  const stripe = createStripeServerClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const userId = session.client_reference_id;
  const plan = (session.metadata?.plan ?? "monthly") as "monthly" | "yearly";

  if (!userId) {
    throw new Error("Checkout session is missing the user reference.");
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    throw new Error("Checkout session is not completed yet.");
  }

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? "";

  await UserModel.findByIdAndUpdate(userId, {
    $set: {
      "subscription.plan": plan,
      "subscription.status": "active",
      "subscription.cancelAtPeriodEnd": false,
      "subscription.stripeCustomerId":
        typeof session.customer === "string" ? session.customer : "",
      "subscription.stripeSubscriptionId": stripeSubscriptionId,
      "subscription.renewalDate": new Date(
        Date.now() + (plan === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .slice(0, 10),
    },
  });

  await recordSubscriptionDonationForUser(userId, `checkout:${session.id}`);

  return session;
}

export async function persistStripeEvent(event: Stripe.Event) {
  await connectToDatabase();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      const plan = (session.metadata?.plan ?? "monthly") as "monthly" | "yearly";

      if (!userId) {
        return;
      }

      await UserModel.findByIdAndUpdate(userId, {
        $set: {
          "subscription.plan": plan,
          "subscription.status": "active",
          "subscription.cancelAtPeriodEnd": false,
          "subscription.stripeCustomerId":
            typeof session.customer === "string" ? session.customer : "",
          "subscription.stripeSubscriptionId":
            typeof session.subscription === "string" ? session.subscription : "",
          "subscription.renewalDate": new Date(
            Date.now() +
              (plan === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000,
          )
            .toISOString()
            .slice(0, 10),
        },
      });

      await recordSubscriptionDonationForUser(userId, `checkout:${session.id}`);
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription & {
        current_period_end?: number;
      };
      const userId = subscription.metadata?.userId;

      if (!userId) {
        return;
      }

      const status =
        subscription.status === "active"
          ? "active"
          : subscription.status === "canceled"
            ? "cancelled"
            : subscription.status === "past_due"
              ? "lapsed"
              : "inactive";

      await UserModel.findByIdAndUpdate(userId, {
        $set: {
          "subscription.status": status,
          "subscription.cancelAtPeriodEnd": subscription.cancel_at_period_end,
          "subscription.stripeCustomerId":
            typeof subscription.customer === "string" ? subscription.customer : "",
          "subscription.stripeSubscriptionId": subscription.id,
          "subscription.renewalDate": new Date(
            (subscription.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000,
          )
            .toISOString()
            .slice(0, 10),
        },
      });
      return;
    }

    case "invoice.payment_succeeded":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice & {
        parent?: {
          subscription_details?: {
            subscription?: string;
          };
        };
      };
      const subscriptionId = invoice.parent?.subscription_details?.subscription;

      if (!subscriptionId) {
        return;
      }

      const subscription = await createStripeServerClient().subscriptions.retrieve(
        subscriptionId,
      );
      const userId = subscription.metadata?.userId;

      if (!userId) {
        return;
      }

      await UserModel.findByIdAndUpdate(userId, {
        $set: {
          "subscription.status":
            event.type === "invoice.payment_succeeded" ? "active" : "lapsed",
        },
      });

      if (event.type === "invoice.payment_succeeded" && invoice.id) {
        await recordSubscriptionDonationForUser(userId, `invoice:${invoice.id}`);
      }
    }
  }
}
