"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

interface CharityDirectoryItem {
  id: string;
  slug: string;
  name: string;
  category: string;
  region: string;
  description: string;
  impactMetric: string;
  upcomingEvent: string;
  featured: boolean;
  totalDonations: number;
  supporterCount: number;
}

interface CharityDirectoryProps {
  charities: CharityDirectoryItem[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CharityDirectory({ charities }: CharityDirectoryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(charities.map((charity) => charity.category)))],
    [charities],
  );

  const filtered = useMemo(() => {
    return charities.filter((charity) => {
      const matchesCategory = category === "all" || charity.category === category;
      const haystack = `${charity.name} ${charity.description} ${charity.region}`.toLowerCase();
      const matchesSearch = haystack.includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [charities, category, search]);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
      <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
              Charity directory
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              Browse causes before you ever subscribe.
            </h1>
          </div>
          <p className="max-w-2xl text-base leading-7 text-slate-600">
            Search by mission, region, or impact area. Every charity profile explains
            what your membership supports and what independent donations can fund too.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_240px]">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search charities, regions, or mission keywords"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none"
          >
            {categories.map((option) => (
              <option key={option} value={option}>
                {option === "all" ? "All categories" : option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((charity) => (
            <article
              key={charity.id}
              className="rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f6f9fd)] p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] text-lg font-semibold text-slate-950">
                  {getInitials(charity.name)}
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                    {charity.category}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{charity.region}</p>
                </div>
              </div>

              <h2 className="mt-6 text-2xl font-semibold text-slate-950">{charity.name}</h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">{charity.description}</p>

              <div className="mt-5 rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-300">{charity.impactMetric}</p>
                <p className="mt-2 text-lg font-medium">{charity.upcomingEvent}</p>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                <span>{charity.supporterCount} supporters</span>
                <span>${charity.totalDonations.toFixed(0)} total raised</span>
              </div>

              <Link
                href={`/charities/${charity.slug}`}
                prefetch={false}
                className="mt-6 inline-flex rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
              >
                View charity profile
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
