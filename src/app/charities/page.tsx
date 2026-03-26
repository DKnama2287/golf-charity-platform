import { CharityDirectory } from "@/components/charity-directory";
import { SiteHeader } from "@/components/site-header";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CharityModel } from "@/lib/models/charity";
import { toPlainObject } from "@/lib/serializers";
import { ensureBootstrapData } from "@/lib/services/bootstrap.service";

export default async function CharitiesPage() {
  await ensureBootstrapData();
  await connectToDatabase();

  const charities = toPlainObject(
    await CharityModel.find().sort({ featured: -1, createdAt: 1 }).lean(),
  ) as Array<Record<string, unknown>>;

  const mapped = charities.map((charity) => ({
    id: String(charity._id ?? charity.id ?? ""),
    slug: String(charity.slug ?? ""),
    name: String(charity.name ?? ""),
    category: String(charity.category ?? ""),
    region: String(charity.region ?? ""),
    description: String(charity.description ?? ""),
    impactMetric: String(charity.impactMetric ?? ""),
    upcomingEvent: String(charity.upcomingEvent ?? ""),
    featured: Boolean(charity.featured),
    totalDonations: Number(charity.totalDonations ?? 0),
    supporterCount: Number(charity.supporterCount ?? 0),
  }));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#08111f_0%,#132238_28%,#f6f8fc_28%,#f8fbff_100%)]">
      <SiteHeader />
      <CharityDirectory charities={mapped} />
    </div>
  );
}
