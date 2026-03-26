import Link from "next/link";
import { RoleAwareHomeCta } from "@/components/role-aware-home-cta";
import { SiteHeader } from "@/components/site-header";
import { connectToDatabase } from "@/lib/db/mongodb";
import { CharityModel } from "@/lib/models/charity";
import { users } from "@/lib/mock-data";
import { toPlainObject } from "@/lib/serializers";
import { ensureBootstrapData } from "@/lib/services/bootstrap.service";
import {
  buildWinners,
  calculatePrizePool,
  formatCurrency,
  formatTierLabel,
  generateDrawPreview,
} from "@/lib/platform";

const experiencePillars = [
  {
    title: "Subscribe with intent",
    body: "Plans are positioned as impact memberships first, with transparent charity allocation and a premium annual option.",
  },
  {
    title: "Log five real rounds",
    body: "Stableford entry feels lightweight and confident. As a new score lands, the oldest round gracefully rotates out.",
  },
  {
    title: "Watch the draw unfold",
    body: "Monthly participation is clear before the event and emotionally rewarding after it, whether the outcome is a win or a rollover.",
  },
];

const publicVisitorChecks = [
  "View the platform concept without creating an account.",
  "Explore listed charities and understand where contributions go.",
  "Understand draw mechanics before committing to a subscription.",
  "Start the subscription journey by logging in as a subscriber.",
];

const subscriptionCards = [
  {
    title: "Monthly Momentum",
    price: "$19",
    suffix: "/month",
    detail: "Flexible access for new members who want to start contributing immediately.",
    accent: "bg-white text-slate-950",
  },
  {
    title: "Yearly Impact",
    price: "$149",
    suffix: "/year",
    detail: "Best-value plan with stronger prize-pool contribution and a more committed giving story.",
    accent:
      "bg-[linear-gradient(135deg,rgba(214,245,107,0.96),rgba(99,210,255,0.9))] text-slate-950",
  },
];

const flowCards = [
  {
    title: "Subscription flow",
    steps: [
      "Start Membership from the hero or pricing section.",
      "Choose monthly or yearly access.",
      "Select a charity and set your contribution percentage.",
      "Complete checkout and return to a guided onboarding state.",
    ],
  },
  {
    title: "Score entry flow",
    steps: [
      "Open the dashboard and tap Add Score.",
      "Enter Stableford score and round date with instant validation.",
      "Save and watch the latest-five stack update automatically.",
      "Receive confirmation that next draw eligibility remains active.",
    ],
  },
  {
    title: "Draw participation flow",
    steps: [
      "Track the upcoming draw date and current prize pool.",
      "See published winning numbers with clear match feedback.",
      "If selected, upload proof directly from the winnings card.",
      "Follow verification and payout states without confusion.",
    ],
  },
];

export default async function Home() {
  await ensureBootstrapData();
  await connectToDatabase();

  const prizePool = calculatePrizePool(users);
  const weightedDraw = generateDrawPreview(users, "weighted");
  const winners = buildWinners(users, weightedDraw);
  const featured = toPlainObject(
    await CharityModel.find({ featured: true }).sort({ createdAt: 1 }).limit(3).lean(),
  ) as Array<Record<string, unknown>>;
  const charityCount = await CharityModel.countDocuments();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#060c19_0%,#0a1324_36%,#f6f8fc_36%,#f8fbff_100%)]">
      <SiteHeader />
      <main className="overflow-hidden">
        <section className="relative isolate">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="orb orb-cyan left-[8%] top-12" />
            <div className="orb orb-lime right-[8%] top-40" />
            <div className="orb orb-violet left-1/2 top-[22rem]" />
            <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(99,210,255,0.2),transparent_60%)]" />
          </div>

          <div className="mx-auto grid w-full max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-24">
            <div className="relative z-10 space-y-8">
              <div className="inline-flex reveal-up rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
                Charity-first golf membership
              </div>

              <div className="space-y-6">
                <h1 className="reveal-up max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-7xl">
                  Play with feeling.
                  <span className="block text-cyan-200">Give with clarity.</span>
                </h1>
                <p className="reveal-up max-w-2xl text-lg leading-8 text-slate-300 [animation-delay:120ms]">
                  BirdieFund turns a golf subscription into an emotionally rich
                  giving experience. Members support a chosen cause, enter prize
                  draws through their latest Stableford form, and stay connected
                  to visible charitable impact every month.
                </p>
              </div>

              <div className="reveal-up [animation-delay:180ms]">
                <RoleAwareHomeCta variant="hero" />
              </div>

              <div className="reveal-up grid gap-4 sm:grid-cols-3 [animation-delay:240ms]">
                {[
                  { value: `${users.length}`, label: "active founding members" },
                  {
                    value: formatCurrency(prizePool.charityTotal),
                    label: "current charity allocation",
                  },
                  {
                    value: formatCurrency(prizePool.tiers.match5),
                    label: "jackpot layer this month",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-card rounded-[30px] p-5 text-white"
                  >
                    <p className="text-3xl font-semibold">{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 reveal-up [animation-delay:140ms]">
              <div className="glass-card rounded-[38px] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.38)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
                      Monthly draw preview
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">
                      Weighted Simulation
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                      The design frames the draw as an elegant reveal rather than
                      a lottery clone, with calm motion and clear prize logic.
                    </p>
                  </div>
                  <span className="pulse-soft rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
                    Live-prep mode
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-5 gap-3">
                  {weightedDraw.numbers.map((number, index) => (
                    <div
                      key={number}
                      className="float-card flex aspect-square items-center justify-center rounded-[28px] bg-[linear-gradient(180deg,rgba(99,210,255,0.24),rgba(214,245,107,0.18))] text-2xl font-semibold text-white"
                      style={{ animationDelay: `${index * 110}ms` }}
                    >
                      {number}
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                      Impact strip
                    </p>
                    <div className="mt-4 grid gap-3">
                      {[
                        {
                          label: "Prize pool",
                          value: formatCurrency(prizePool.totalPool),
                        },
                        {
                          label: "Current rollover",
                          value: formatCurrency(weightedDraw.jackpotRollover),
                        },
                        {
                          label: "Charity allocation",
                          value: formatCurrency(prizePool.charityTotal),
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-2xl bg-white/4 px-4 py-3"
                        >
                          <span className="text-sm text-slate-300">{item.label}</span>
                          <span className="font-semibold text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                      Winner preview
                    </p>
                    <div className="mt-4 grid gap-3">
                      {winners.length === 0 ? (
                        <div className="rounded-2xl bg-white/4 px-4 py-4 text-sm text-slate-300">
                          No winners in this simulation. The 5-match pool rolls
                          into next month automatically.
                        </div>
                      ) : (
                        winners.map((winner) => (
                          <div
                            key={winner.id}
                            className="rounded-2xl bg-white/4 px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-white">{winner.userName}</p>
                                <p className="text-sm text-slate-400">
                                  {formatTierLabel(winner.tier)}
                                </p>
                              </div>
                              <p className="font-semibold text-cyan-200">
                                {formatCurrency(winner.amount)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10">
          <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Public visitor path
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Everything important is visible before login.
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                Visitors can understand the product, explore the charity angle,
                review the draw logic, and only then move into subscriber login
                to begin the paid journey.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {publicVisitorChecks.map((item) => (
                <div
                  key={item}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5 text-sm leading-6 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-4">
            {[
              { label: "Members", value: "248", detail: "growing impact community" },
              { label: "Prize Pool", value: "$12.4k", detail: "live monthly pool model" },
              {
                label: "Charities",
                value: String(charityCount),
                detail: "searchable and curated",
              },
              { label: "Load Feel", value: "Instant", detail: "mobile-first responsive UI" },
            ].map((item, index) => (
              <div
                key={item.label}
                className="reveal-up rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_70px_rgba(15,23,42,0.07)]"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  {item.value}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 lg:grid-cols-3 lg:px-10">
          {experiencePillars.map((item, index) => (
            <article
              key={item.title}
              className="reveal-up rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] text-sm font-bold text-slate-950">
                0{index + 1}
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
                Featured charities
              </p>
              <h2 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
                The visual language starts with people, purpose, and momentum.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              Instead of leaning on fairways or golf memorabilia, the platform
              foregrounds mission storytelling, impact metrics, and confidence
              in how each membership creates value.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {featured.map((charity, index) => (
              <article
                key={String(charity._id ?? charity.id ?? "")}
                className="hover-lift reveal-up rounded-[34px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f4f9ff)] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
                style={{ animationDelay: `${index * 110}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                    {String(charity.category ?? "")}
                  </span>
                  <span className="text-sm text-slate-500">{String(charity.region ?? "")}</span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-slate-950">
                  {String(charity.name ?? "")}
                </h3>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  {String(charity.description ?? "")}
                </p>
                <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
                  <p className="text-sm text-slate-300">{String(charity.impactMetric ?? "")}</p>
                  <p className="mt-2 text-lg font-medium">{String(charity.upcomingEvent ?? "")}</p>
                </div>
                <Link
                  href={`/charities/${String(charity.slug ?? "")}`}
                  prefetch={false}
                  className="mt-5 inline-flex rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-4 py-3 text-sm font-semibold text-slate-950"
                >
                  View charity
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
          <div className="rounded-[38px] bg-slate-950 p-8 text-white shadow-[0_24px_90px_rgba(2,6,23,0.24)]">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
              Membership plans
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              Premium structure, transparent value.
            </h2>

            <div className="mt-8 grid gap-4">
              {subscriptionCards.map((card) => (
                <div
                  key={card.title}
                  className={`rounded-[30px] p-6 ${card.accent}`}
                >
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.24em] opacity-70">
                        {card.title}
                      </p>
                      <div className="mt-3 flex items-end gap-2">
                        <span className="text-5xl font-semibold">{card.price}</span>
                        <span className="pb-2 text-sm opacity-70">{card.suffix}</span>
                      </div>
                    </div>
                    <span className="rounded-full border border-current/15 px-3 py-1 text-xs uppercase tracking-[0.24em]">
                      Charity-led
                    </span>
                  </div>
                  <p className="mt-4 max-w-xl text-sm leading-6 opacity-80">
                    {card.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm leading-6 text-slate-300">
                Subscription starts after subscriber login. Public visitors can
                review plans here first, then continue into login to activate a
                monthly or yearly membership.
              </p>
              <div className="mt-5">
                <RoleAwareHomeCta variant="hero" />
              </div>
            </div>
          </div>

          <div className="rounded-[38px] border border-slate-200 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
              Experience flows
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              The journey is designed to feel guided, not dense.
            </h2>
            <div className="mt-8 grid gap-4">
              {flowCards.map((flow) => (
                <div
                  key={flow.title}
                  className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="text-lg font-semibold text-slate-950">{flow.title}</p>
                  <div className="mt-4 grid gap-2">
                    {flow.steps.map((step, index) => (
                      <div
                        key={step}
                        className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold text-white">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-4 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:pb-20">
          <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
              Trust and transparency
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
              Every winning moment is traceable.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                "Secure subscription billing through Stripe.",
                "Admin-controlled simulation and publication workflow.",
                "Proof upload and review before final payout.",
                "Published prize pool logic with rollover support.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[36px] bg-[linear-gradient(135deg,#08111f,#132238)] p-8 text-white shadow-[0_24px_100px_rgba(2,6,23,0.28)]">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
              Final CTA
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              Join a platform where every round supports something real.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              This UI direction is intentionally clean, modern, and human. It
              avoids traditional golf styling in favor of atmosphere, clarity,
              and measurable impact.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <RoleAwareHomeCta variant="footer" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
