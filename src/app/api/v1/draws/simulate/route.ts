import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { errorResponse, successResponse } from "@/lib/http";
import { createSimulationDraw } from "@/lib/services/draw-admin.service";

const schema = z.object({
  mode: z.enum(["random", "weighted"]).optional().default("random"),
});

export async function POST(request: Request) {
  const auth = await requireAdminUser();

  if (auth.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (auth.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return errorResponse("Invalid draw simulation payload.", 400, parsed.error.flatten());
  }

  const { draw, result } = await createSimulationDraw(parsed.data.mode);

  return successResponse(
    {
      ...result,
      drawId: String(draw._id),
      drawMonth: draw.drawMonth,
      published: draw.published,
    },
    "Draw simulated",
  );
}
