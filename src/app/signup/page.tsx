"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_LOGIN_REDIRECT } from "@/lib/auth/constants";

interface SignupCharity {
  id: string;
  name: string;
  category: string;
  impactMetric: string;
}

async function readApiResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as {
      message?: string;
    };
  } catch {
    return {
      message: "Something went wrong. Please try again.",
    };
  }
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [charities, setCharities] = useState<SignupCharity[]>([]);
  const [selectedCharityId, setSelectedCharityId] = useState("");
  const [contributionPercent, setContributionPercent] = useState("10");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCharities, setLoadingCharities] = useState(true);

  useEffect(() => {
    async function loadCharities() {
      try {
        const response = await fetch("/api/v1/charities", {
          cache: "no-store",
        });
        const result = await readApiResponse(response) as {
          data?: Array<Record<string, unknown>>;
        };

        const nextCharities = (result.data ?? []).map((charity) => ({
          id: String(charity._id ?? charity.id ?? ""),
          name: String(charity.name ?? ""),
          category: String(charity.category ?? ""),
          impactMetric: String(charity.impactMetric ?? ""),
        }));

        setCharities(nextCharities);
        setSelectedCharityId(nextCharities[0]?.id ?? "");
      } finally {
        setLoadingCharities(false);
      }
    }

    void loadCharities();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const parsedContributionPercent = Math.min(
      100,
      Math.max(10, Number(contributionPercent) || 10),
    );

    if (!selectedCharityId) {
      setMessage("Please select a charity before creating your account.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          charityId: selectedCharityId,
          contributionPercent: parsedContributionPercent,
        }),
      });

      const result = await readApiResponse(response);
      setMessage(result.message ?? "Signup completed.");

      if (response.ok) {
        window.location.href = DEFAULT_LOGIN_REDIRECT;
      }
    } catch {
      setMessage("Unable to create your account right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#08111f,#132238)] px-6 py-12">
      <div className="w-full max-w-md rounded-[34px] border border-white/10 bg-white/95 p-8 text-slate-950 shadow-[0_30px_100px_rgba(0,0,0,0.25)]">
        <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Signup</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Create your membership
        </h1>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
          Signup is for subscribers only. If you are the platform admin, use{" "}
          <Link href="/login?role=admin" prefetch={false} className="font-semibold text-slate-950">
            admin login
          </Link>
          .
        </div>
        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            required
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
          />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              required
              placeholder="Create a strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
            <span className="text-xs text-slate-600">💡 Minimum 6 characters required</span>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Choose your charity</span>
            <select
              required
              value={selectedCharityId}
              onChange={(event) => setSelectedCharityId(event.target.value)}
              disabled={loadingCharities}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              {loadingCharities ? <option>Loading charities...</option> : null}
              {!loadingCharities && charities.length === 0 ? (
                <option>No charities available</option>
              ) : null}
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name} · {charity.category}
                </option>
              ))}
            </select>
          </label>
          {selectedCharityId ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              {charities.find((charity) => charity.id === selectedCharityId)?.impactMetric}
            </div>
          ) : null}
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Charity contribution percentage
            </span>
            <input
              type="number"
              min={10}
              max={100}
              required
              value={contributionPercent}
              onChange={(event) => {
                const value = event.target.value;

                if (value === "") {
                  setContributionPercent("10");
                  return;
                }

                const clamped = Math.min(100, Math.max(10, Number(value) || 10));
                setContributionPercent(String(clamped));
              }}
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting || loadingCharities || !selectedCharityId}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        <p className="mt-6 text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" prefetch={false} className="font-semibold text-slate-950">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
