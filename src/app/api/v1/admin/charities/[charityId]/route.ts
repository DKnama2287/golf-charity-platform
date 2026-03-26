import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { CharityModel } from "@/lib/models/charity";
import { toPlainObject } from "@/lib/serializers";

const schema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  description: z.string().optional(),
  websiteUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  countryCode: z.string().optional(),
  impactMetric: z.string().optional(),
  upcomingEvent: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ charityId: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { charityId } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("Invalid charity payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const charity = await CharityModel.findByIdAndUpdate(
    charityId,
    {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.slug !== undefined ? { slug: parsed.data.slug } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.websiteUrl !== undefined ? { websiteUrl: parsed.data.websiteUrl } : {}),
      ...(parsed.data.imageUrl !== undefined ? { imageUrl: parsed.data.imageUrl } : {}),
      ...(parsed.data.countryCode !== undefined
        ? { countryCode: parsed.data.countryCode, region: parsed.data.countryCode }
        : {}),
      ...(parsed.data.impactMetric !== undefined ? { impactMetric: parsed.data.impactMetric } : {}),
      ...(parsed.data.upcomingEvent !== undefined ? { upcomingEvent: parsed.data.upcomingEvent } : {}),
      ...(parsed.data.isFeatured !== undefined ? { featured: parsed.data.isFeatured } : {}),
    },
    { new: true },
  ).lean();

  if (!charity) {
    return errorResponse("Charity not found.", 404);
  }

  return successResponse(toPlainObject(charity), "Charity updated");
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ charityId: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { charityId } = await params;

  await connectToDatabase();
  await CharityModel.findByIdAndDelete(charityId);

  return successResponse({ id: charityId }, "Charity deleted");
}
