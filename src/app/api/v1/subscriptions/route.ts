import Stripe from "stripe";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth/server";
import { successResponse, errorResponse } from "@/lib/http";

const schema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}

async function resolveStripePriceId(
  stripe: Stripe,
  configuredId: string,
) {
  if (configuredId.startsWith("price_")) {
    return configuredId;
  }

  if (configuredId.startsWith("prod_")) {
    const product = await stripe.products.retrieve(configuredId, {
      expand: ["default_price"],
    });

    const defaultPrice = product.default_price;

    if (!defaultPrice) {
      throw new Error(
        `Stripe product ${configuredId} does not have a default price attached.`,
      );
    }

    if (typeof defaultPrice === "string") {
      return defaultPrice;
    }

    return defaultPrice.id;
  }

  throw new Error(
    "Stripe plan configuration must use a price ID or a product ID.",
  );
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    const parsed = schema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return errorResponse("Invalid subscription payload.", 400, parsed.error.flatten());
    }

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const stripe = getStripeClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const configuredPlanId =
      parsed.data.plan === "monthly"
        ? process.env.STRIPE_MONTHLY_PRICE_ID
        : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!stripe || !configuredPlanId) {
      return errorResponse(
        "Stripe is not configured. Add your secret key and monthly/yearly plan IDs in .env.local.",
        500,
      );
    }

    const priceId = await resolveStripePriceId(stripe, configuredPlanId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/dashboard?checkout=cancelled`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: {
        plan: parsed.data.plan,
        amount:
          parsed.data.plan === "monthly"
            ? String(user.subscription.monthlyPrice)
            : String(user.subscription.yearlyPrice),
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: parsed.data.plan,
        },
      },
    });

    if (!session.url) {
      return errorResponse("Stripe checkout session was created without a redirect URL.", 500);
    }

    return successResponse(
      {
        checkoutUrl: session.url,
        subscriptionReference: session.id,
      },
      "Checkout session created",
      201,
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to start subscription checkout.",
      500,
    );
  }
}
