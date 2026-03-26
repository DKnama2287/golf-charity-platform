import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { PrizePoolConfigModel } from "@/lib/models/prize-pool-config";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tier: string }> }
) {
  try {
    await connectToDatabase();

    const { tier } = await context.params;
    const body = await request.json();
    const { amount } = body;

    // Validate tier
    if (!["match5", "match4", "match3"].includes(tier)) {
      return errorResponse("Invalid tier. Must be match5, match4, or match3.", 400);
    }

    // Validate amount
    if (typeof amount !== "number" || amount < 0) {
      return errorResponse("Amount must be a non-negative number.", 400);
    }

    // Get or create config
    let config = await PrizePoolConfigModel.findOne();
    if (!config) {
      config = new PrizePoolConfigModel();
    }

    // Update the appropriate tier
    if (tier === "match5") {
      config.match5Amount = amount;
    } else if (tier === "match4") {
      config.match4Amount = amount;
    } else if (tier === "match3") {
      config.match3Amount = amount;
    }

    // Mark isActive only if we have overrides
    config.isActive = !!(config.match5Amount || config.match4Amount || config.match3Amount);

    await config.save();

    return successResponse({
      message: `Updated ${tier} pool to ${amount}`,
      tier,
      amount,
      config: {
        match5Amount: config.match5Amount,
        match4Amount: config.match4Amount,
        match3Amount: config.match3Amount,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update prize tier";
    console.error("Prize pool update error:", error);
    return errorResponse(message, 500);
  }
}
