import { requireAdminUser } from "@/lib/auth/server";
import { errorResponse, successResponse } from "@/lib/http";
import { publishDraw } from "@/lib/services/draw-admin.service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ drawId: string }> },
) {
  const auth = await requireAdminUser();

  if (auth.error === "unauthorized") {
    return errorResponse("Unauthorized", 401);
  }

  if (auth.error === "forbidden") {
    return errorResponse("Forbidden", 403);
  }

  try {
    const { drawId } = await params;
    const { draw, result } = await publishDraw(drawId);

    return successResponse(
      {
        drawId: String(draw._id),
        drawMonth: draw.drawMonth,
        published: draw.published,
        publishedAt: draw.publishedAt,
        result,
      },
      "Draw published successfully",
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unable to publish draw.",
      400,
    );
  }
}
