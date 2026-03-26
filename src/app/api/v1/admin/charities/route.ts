import { z } from "zod";
import { requireAdminUser } from "@/lib/auth/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { errorResponse, successResponse } from "@/lib/http";
import { CharityModel } from "@/lib/models/charity";
import { toPlainObject } from "@/lib/serializers";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional().default(""),
  websiteUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  countryCode: z.string().optional(),
  impactMetric: z.string().optional(),
  upcomingEvent: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
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

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  await connectToDatabase();
  const charities = await CharityModel.find().sort({ createdAt: 1 }).lean();
  return successResponse(toPlainObject(charities));
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("Invalid charity payload.", 400, parsed.error.flatten());
  }

  await connectToDatabase();
  const charity = await CharityModel.create({
    name: parsed.data.name,
    slug: parsed.data.slug,
    category: parsed.data.category,
    region: parsed.data.countryCode || "Global",
    description: parsed.data.description,
    websiteUrl: parsed.data.websiteUrl,
    imageUrl: parsed.data.imageUrl,
    countryCode: parsed.data.countryCode,
    impactMetric: parsed.data.impactMetric,
    upcomingEvent: parsed.data.upcomingEvent,
    featured: parsed.data.isFeatured,
  });

  return successResponse(toPlainObject(charity.toObject()), "Charity created", 201);
}
