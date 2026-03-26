interface AnalyticsPanelProps {
  title: string;
  items: string[];
}

export function AnalyticsPanel({ title, items }: AnalyticsPanelProps) {
  return (
    <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">{title}</p>
      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}
