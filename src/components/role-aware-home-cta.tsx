"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SessionUser {
  role: "user" | "admin";
}

interface RoleAwareHomeCtaProps {
  variant?: "hero" | "footer";
}

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export function RoleAwareHomeCta({
  variant = "hero",
}: RoleAwareHomeCtaProps) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch("/api/v1/auth/me", { cache: "no-store" });
        const result = await readJson(response);

        if (response.ok) {
          setUser({
            role: result.data?.role === "admin" ? "admin" : "user",
          });
        }
      } catch {
        setUser(null);
      }
    }

    void loadSession();
  }, []);

  const dashboardHref = user?.role === "admin" ? "/admin" : "/dashboard";
  const subscriberHref = "/login?role=user";
  const adminHref = "/login?role=admin";

  const primaryClass =
    variant === "hero"
      ? "hover-lift rounded-full bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-7 py-4 text-center text-sm font-semibold text-slate-950 shadow-[0_22px_60px_rgba(99,210,255,0.26)]"
      : "hover-lift rounded-full bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-6 py-4 text-center text-sm font-semibold text-slate-950";

  const secondaryClass =
    variant === "hero"
      ? "hover-lift rounded-full border border-white/14 px-7 py-4 text-center text-sm font-semibold text-white transition hover:bg-white/6"
      : "hover-lift rounded-full border border-white/14 px-6 py-4 text-center text-sm font-semibold text-white";

  if (user) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link href={dashboardHref} prefetch={false} className={primaryClass}>
          Continue with your dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <Link href={subscriberHref} prefetch={false} className={primaryClass}>
        Continue as Subscriber
      </Link>
      <Link href={adminHref} prefetch={false} className={secondaryClass}>
        Continue as Admin
      </Link>
    </div>
  );
}
