import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { UserModel } from "@/lib/models/user";
import { WinningModel } from "@/lib/models/winning";
import { toPlainObject } from "@/lib/serializers";

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

export async function POST(
  _request: Request,
  context: { params: Promise<{ winningId: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { winningId } = await context.params;

  await connectToDatabase();
  const winning = await WinningModel.findById(winningId).lean();

  if (!winning) {
    return errorResponse("Winning not found.", 404);
  }

  if (winning.verificationStatus !== "approved") {
    return errorResponse("Only approved winners can be marked as paid.", 400);
  }

  if (winning.paymentStatus === "paid") {
    return errorResponse("This winning is already marked as paid.", 400);
  }

  const data = await WinningModel.findByIdAndUpdate(
    winningId,
    {
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
    },
    { new: true },
  ).lean();

  await UserModel.findByIdAndUpdate(data.userId, {
    $inc: {
      "winnings.pendingAmount": -data.amount,
      "winnings.paidAmount": data.amount,
    },
  });

  return successResponse(toPlainObject(data), "Winning marked paid");
}
