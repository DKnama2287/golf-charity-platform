import Link from "next/link";
import { notFound } from "next/navigation";
import { IndependentDonationForm } from "@/components/independent-donation-form";
import { SiteHeader } from "@/components/site-header";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CharityModel } from "@/lib/models/charity";
import { toPlainObject } from "@/lib/serializers";
import { ensureBootstrapData } from "@/lib/services/bootstrap.service";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function CharityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureBootstrapData();
  await connectToDatabase();

  const { slug } = await params;
  const charity = toPlainObject(
    await CharityModel.findOne({ slug }).lean(),
  ) as Record<string, unknown> | null;

  if (!charity) {
    notFound();
  }

  const charityId = String(charity._id ?? charity.id ?? "");
  const charityName = String(charity.name ?? "");

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#08111f_0%,#132238_32%,#f6f8fc_32%,#f8fbff_100%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
        <section className="rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.94),rgba(11,20,36,0.88))] p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.36)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
                Charity profile
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                {charityName}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                {String(charity.description ?? "")}
              </p>
            </div>
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] text-3xl font-semibold text-slate-950">
              {getInitials(charityName)}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { label: "Category", value: String(charity.category ?? "") },
              { label: "Region", value: String(charity.region ?? "") },
              { label: "Impact", value: String(charity.impactMetric ?? "") },
              { label: "Upcoming event", value: String(charity.upcomingEvent ?? "") },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-[28px] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-2 text-base font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
              Why members choose this cause
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              A donation path tied to impact, not just optics.
            </h2>
            <div className="mt-6 grid gap-4">
              {[
                "Subscribers can choose this charity during signup and adjust their contribution later.",
                "Independent donations work even if someone does not want to join the gameplay side.",
                "Upcoming events make the profile feel active and community-led.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              prefetch={false}
              className="mt-8 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              Choose this charity at signup
            </Link>
          </article>

          <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
              Independent donation
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Support this cause without gameplay.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              This option is separate from subscription entry and can be used by any
              visitor who wants to contribute directly.
            </p>
            <div className="mt-6">
              <IndependentDonationForm charityId={charityId} />
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
