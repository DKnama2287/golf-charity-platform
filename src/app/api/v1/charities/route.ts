import { connectToDatabase } from "@/lib/db/mongodb";
import { successResponse } from "@/lib/http";
import { CharityModel } from "@/lib/models/charity";
import { ensureBootstrapData } from "@/lib/services/bootstrap.service";
import { toPlainObject } from "@/lib/serializers";

export async function GET(request: Request) {
  await ensureBootstrapData();
  await connectToDatabase();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const category = searchParams.get("category")?.trim();
  const featured = searchParams.get("featured");

  const query: Record<string, unknown> = {};

  if (featured === "true") {
    query.featured = true;
  }

  if (category && category !== "all") {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { region: { $regex: search, $options: "i" } },
    ];
  }

  const charities = await CharityModel.find(query)
    .sort({ featured: -1, createdAt: 1 })
    .lean();
  return successResponse(toPlainObject(charities));
}
