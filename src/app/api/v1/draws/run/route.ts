import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { errorResponse, successResponse } from "@/lib/http";
import { createReadyDraw } from "@/lib/services/draw-admin.service";

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
    return errorResponse("Invalid draw execution payload.", 400, parsed.error.flatten());
  }

  try {
    const { draw, result } = await createReadyDraw(parsed.data.mode);

    return successResponse(
      {
        ...result,
        drawId: String(draw._id),
        drawMonth: draw.drawMonth,
        published: draw.published,
      },
      "Draw prepared. Review and publish when ready.",
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to prepare draw.",
      400,
    );
  }
}
