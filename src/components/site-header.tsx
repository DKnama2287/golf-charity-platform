"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SessionUser {
  id: string;
  role: "user" | "admin";
}

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export function SiteHeader() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/v1/auth/me", { cache: "no-store" });
        const result = await readJson(response);

        if (response.ok) {
          setUser({
            id: String(result.data?.id ?? ""),
            role: result.data?.role === "admin" ? "admin" : "user",
          });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    void loadSession();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
      });
    } finally {
      window.location.href = "/";
    }
  }

  const roleLink =
    user?.role === "admin"
      ? { href: "/admin", label: "Admin Panel" }
      : { href: "/dashboard", label: "Subscriber Panel" };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(7,10,18,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link href="/" prefetch={false} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d5ff5f,#65d4ff)] text-sm font-bold text-slate-950">
            BH
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/70">
              BirdieFund
            </p>
            <p className="text-lg font-semibold text-white">Play For Good</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/"
            prefetch={false}
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/charities"
            prefetch={false}
            className="text-sm text-slate-300 transition hover:text-white"
          >
            Charities
          </Link>

          {loading ? (
            <span className="text-sm text-slate-400">Loading...</span>
          ) : user ? (
            <>
              <Link
                href={roleLink.href}
                prefetch={false}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                {roleLink.label}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                prefetch={false}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/signup"
                prefetch={false}
                className="text-sm text-slate-300 transition hover:text-white"
              >
                Signup
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
