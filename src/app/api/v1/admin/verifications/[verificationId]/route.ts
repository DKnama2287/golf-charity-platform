import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { WinnerVerificationModel } from "@/lib/models/winner-verification";
import { WinningModel } from "@/lib/models/winning";
import { toPlainObject } from "@/lib/serializers";

const schema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

async function requireAdmin() {
  const result = await requireAdminUser();
  if (result.error === "unauthorized") {
    return { error: errorResponse("Unauthorized", 401) };
  }
  if (result.error === "forbidden") {
    return { error: errorResponse("Forbidden", 403) };
  }
  return result;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ verificationId: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { verificationId } = await context.params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("Invalid verification review payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const data = await WinnerVerificationModel.findByIdAndUpdate(
    verificationId,
    {
      status: parsed.data.status,
      rejection_reason: parsed.data.rejectionReason ?? null,
      reviewedAt: new Date().toISOString(),
      reviewedBy: auth.user?.id ?? "",
      rejectionReason: parsed.data.rejectionReason ?? "",
    },
    { new: true },
  ).lean();

  if (!data) {
    return errorResponse("Verification not found.", 404);
  }

  await WinningModel.findOneAndUpdate(
    { _id: data.winningId },
    {
      $set: {
        verificationStatus: parsed.data.status,
      },
    },
  );

  return successResponse(toPlainObject(data), "Verification reviewed");
}
