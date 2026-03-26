import type { DrawResult } from "@/lib/types";

interface DrawControlPanelProps {
  draws: DrawResult[];
}

export function DrawControlPanel({ draws }: DrawControlPanelProps) {
  return (
    <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
            Draw control center
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Run, simulate, and publish
          </h2>
        </div>
        <div className="flex gap-3">
          <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            Simulate Draw
          </div>
          <div className="rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-4 py-3 text-sm font-semibold text-slate-950">
            Publish Results
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {draws.map((draw) => (
          <div
            key={draw.id}
            className="rounded-[30px] border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                  {draw.mode} draw
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950">
                  {draw.month}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                {draw.published ? "Published" : "Simulation"}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2">
              {draw.numbers.map((number) => (
                <div
                  key={number}
                  className="flex aspect-square items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white"
                >
                  {number}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
