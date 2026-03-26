import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth/server";
import { errorResponse, successResponse } from "@/lib/http";
import { activateSubscriptionForCheckoutSession } from "@/lib/services/subscription.service";

const schema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) {
      return errorResponse("Invalid subscription confirmation payload.", 400, parsed.error.flatten());
    }

    const session = await activateSubscriptionForCheckoutSession(parsed.data.sessionId);

    if (session.client_reference_id !== user.id) {
      return errorResponse("This checkout session does not belong to the current user.", 403);
    }

    return successResponse(
      {
        sessionId: session.id,
        status: "active",
      },
      "Subscription confirmed successfully",
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to confirm subscription.",
      500,
    );
  }
}
