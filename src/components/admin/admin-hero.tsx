interface AdminHeroProps {
  totalUsers: string;
  prizePool: string;
  charityTotal: string;
}

export function AdminHero({
  totalUsers,
  prizePool,
  charityTotal,
}: AdminHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.94),rgba(11,20,36,0.88))] p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.36)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="orb orb-cyan left-10 top-8" />
        <div className="orb orb-violet right-10 top-16" />
      </div>

      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
            Administrator Controls
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Draws, charities, winners, and platform analytics in one place.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            The admin dashboard is split into focused modules so the team can
            manage users, run draws, verify winners, and review platform health
            without crowding a single screen.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total users", value: totalUsers },
            { label: "Prize pool", value: prizePool },
            { label: "Charity total", value: charityTotal },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-[28px] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
