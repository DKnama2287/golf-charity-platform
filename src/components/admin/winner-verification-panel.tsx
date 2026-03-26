import { formatTierLabel } from "@/lib/platform";
import type { WinnerRecord } from "@/lib/types";

interface WinnerVerificationPanelProps {
  winners: WinnerRecord[];
}

export function WinnerVerificationPanel({
  winners,
}: WinnerVerificationPanelProps) {
  return (
    <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
        Winner verification queue
      </p>
      <div className="mt-6 grid gap-3">
        {winners.length > 0 ? (
          winners.map((winner) => (
            <div
              key={winner.id}
              className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-slate-950">
                    {winner.userName}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatTierLabel(winner.tier)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                  {winner.verificationStatus}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Payment status: {winner.paymentStatus}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            No projected winners yet for this simulation.
          </div>
        )}
      </div>
    </article>
  );
}
