import Link from "next/link";

interface AdminSidebarProps {
  items: string[];
}

export function AdminSidebar({ items }: AdminSidebarProps) {
  return (
    <aside className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
        Navigation
      </p>
      <div className="mt-6 grid gap-3">
        {items.map((item, index) => (
          <div
            key={item}
            className={`rounded-2xl px-4 py-3 text-left text-sm font-medium ${
              index === 0 ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-700"
            }`}
          >
            {item}
          </div>
        ))}
      </div>
      <Link
        href="/"
        prefetch={false}
        className="hover-lift mt-6 block rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700"
      >
        Back To Home
      </Link>
    </aside>
  );
}
