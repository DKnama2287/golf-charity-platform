import { formatCurrency } from "@/lib/platform";
import type { Charity, CharityDonationSummary } from "@/lib/types";

interface CharityManagementPanelProps {
  charities: Charity[];
  donationSummary: CharityDonationSummary[];
}

export function CharityManagementPanel({
  charities,
  donationSummary,
}: CharityManagementPanelProps) {
  return (
    <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
          Charity management
        </p>
        <div className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
          Add Charity
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {charities.map((charity) => {
          const totals = donationSummary.find((item) => item.charityId === charity.id);

          return (
            <div
              key={charity.id}
              className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">
                    {charity.name}
                  </p>
                  <p className="text-sm text-slate-500">{charity.upcomingEvent}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                  {charity.category}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-white px-3 py-2">
                  Total donations: {formatCurrency(totals?.totalDonations ?? 0)}
                </span>
                <span className="rounded-full bg-white px-3 py-2">
                  Supporters: {totals?.supporterCount ?? 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
