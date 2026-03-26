import Stripe from "stripe";
import { errorResponse, successResponse } from "@/lib/http";
import { createStripeServerClient, persistStripeEvent } from "@/lib/services/subscription.service";

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return successResponse({ received: true, mode: "mock" });
  }

  const stripe = createStripeServerClient();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return errorResponse("Missing Stripe signature.", 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Invalid webhook signature.",
      400,
    );
  }

  await persistStripeEvent(event);
  return successResponse({ received: true });
}
