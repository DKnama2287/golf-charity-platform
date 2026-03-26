"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency, formatPercent, formatTierLabel } from "@/lib/platform";

interface DashboardUser {
  id: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  charityId: string;
  charityContributionPercent: number;
  drawsEntered: number;
  upcomingDraws: number;
  subscription: {
    plan: "monthly" | "yearly";
    status: "active" | "inactive" | "lapsed" | "cancelled";
    renewalDate: string;
    monthlyPrice: number;
    yearlyPrice: number;
    cancelAtPeriodEnd?: boolean;
  };
  winnings: {
    totalWon: number;
    pendingAmount: number;
    paidAmount: number;
  };
}

interface DashboardScore {
  id: string;
  score: number;
  playedAt: string;
}

interface DashboardCharity {
  id: string;
  name: string;
  category: string;
  impactMetric: string;
  description: string;
  featured: boolean;
}

interface DashboardWinning {
  _id?: string;
  id?: string;
  tier: "match5" | "match4" | "match3";
  amount: number;
  paymentStatus: "pending" | "paid";
  verificationStatus: "pending" | "approved" | "rejected";
  proofUploaded: boolean;
  drawMonth: string;
  verification?: {
    proofFileUrl?: string;
    notes?: string;
    status?: "pending" | "approved" | "rejected";
  } | null;
}

interface DashboardPrizePool {
  totalPrizePool: number;
  nextJackpotRollover: number;
  tiers: {
    match5: number;
    match4: number;
    match3: number;
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

const quickActions = [
  "Keep your last five scores current",
  "Stay eligible for the monthly prize draw",
  "Adjust your charity contribution any time",
  "Track your payout and verification status",
];

function DashboardContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [scores, setScores] = useState<DashboardScore[]>([]);
  const [charities, setCharities] = useState<DashboardCharity[]>([]);
  const [winnings, setWinnings] = useState<DashboardWinning[]>([]);
  const [prizePool, setPrizePool] = useState<DashboardPrizePool | null>(null);
  const [scoreValue, setScoreValue] = useState("32");
  const [scoreDate, setScoreDate] = useState(new Date().toISOString().slice(0, 10));
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingScore, setSavingScore] = useState(false);
  const [savingCharity, setSavingCharity] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingProofFor, setSavingProofFor] = useState<string | null>(null);
  const [startingCheckoutPlan, setStartingCheckoutPlan] = useState<null | "monthly" | "yearly">(
    null,
  );
  const [selectedCharityId, setSelectedCharityId] = useState("");
  const [contributionPercent, setContributionPercent] = useState(10);
  const [proofUrl, setProofUrl] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [selectedWinningId, setSelectedWinningId] = useState<string | null>(null);
  const [confirmingCheckout, setConfirmingCheckout] = useState(false);

  function handleScoreValueChange(value: string) {
    if (value === "") {
      setScoreValue("");
      return;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      return;
    }

    const clamped = Math.min(45, Math.max(1, parsed));
    setScoreValue(String(clamped));
  }

  async function loadDashboard() {
    try {
      const [meResponse, scoresResponse, charitiesResponse, winningsResponse, prizePoolResponse] = await Promise.all([
        fetch("/api/v1/auth/me", { cache: "no-store" }),
        fetch("/api/v1/scores", { cache: "no-store" }),
        fetch("/api/v1/charities", { cache: "no-store" }),
        fetch("/api/v1/winnings", { cache: "no-store" }),
        fetch("/api/v1/prize-pool", { cache: "no-store" }),
      ]);

      const [meResult, scoresResult, charitiesResult, winningsResult, prizePoolResult] = await Promise.all([
        readJson(meResponse),
        readJson(scoresResponse),
        readJson(charitiesResponse),
        readJson(winningsResponse),
        readJson(prizePoolResponse),
      ]);

      if (!meResponse.ok) {
        window.location.href = "/login";
        return;
      }

      const nextUser = meResult.data as DashboardUser;
      setUser(nextUser);
      setFullName(nextUser.fullName);
      setEmail(nextUser.email);
      setScores((scoresResult.data ?? []) as DashboardScore[]);
      setWinnings((winningsResult.data ?? []) as DashboardWinning[]);
      setPrizePool((prizePoolResult.data ?? null) as DashboardPrizePool | null);

      const nextCharities = ((charitiesResult.data ?? []) as Array<Record<string, unknown>>).map(
        (charity) => ({
          id: String(charity._id ?? charity.id ?? ""),
          name: String(charity.name ?? ""),
          category: String(charity.category ?? ""),
          impactMetric: String(charity.impactMetric ?? ""),
          description: String(charity.description ?? ""),
          featured: Boolean(charity.featured),
        }),
      );

      setCharities(nextCharities);
      setSelectedCharityId(nextUser.charityId || nextCharities[0]?.id || "");
      setContributionPercent(nextUser.charityContributionPercent ?? 10);
    } catch {
      setToastMessage("Unable to load your dashboard right now.");
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");

    if (checkoutStatus !== "success" || !sessionId || confirmingCheckout) {
      return;
    }

    async function confirmCheckout() {
      setConfirmingCheckout(true);

      try {
        const response = await fetch("/api/v1/subscriptions/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const result = await readJson(response);

        if (response.ok) {
          showMessage("Subscription activated successfully.");
          await loadDashboard();
          window.history.replaceState({}, "", "/dashboard");
        } else {
          showMessage(result.message ?? "Unable to confirm subscription.");
        }
      } catch {
        showMessage("Unable to confirm subscription.");
      } finally {
        setConfirmingCheckout(false);
      }
    }

    void confirmCheckout();
  }, [searchParams, confirmingCheckout]);

  const selectedCharity = useMemo(
    () => charities.find((charity) => charity.id === selectedCharityId),
    [charities, selectedCharityId],
  );

  const estimatedContribution = user
    ? (user.subscription.plan === "yearly"
        ? user.subscription.yearlyPrice
        : user.subscription.monthlyPrice) *
      (contributionPercent / 100)
    : 0;

  const currentPaymentStatus = user
    ? user.winnings.pendingAmount > 0
      ? "pending"
      : user.winnings.paidAmount > 0
        ? "paid"
        : "no payouts yet"
    : "pending";

  function showMessage(message: string) {
    setToastMessage(message);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2600);
  }

  async function handleSaveScore() {
    if (user?.subscription.status !== "active") {
      showMessage("Subscribe first to unlock score entry.");
      return;
    }

    const nextValue = Number(scoreValue);

    if (!user || Number.isNaN(nextValue) || !scoreDate) {
      showMessage("Enter both a score and a date.");
      return;
    }

    setSavingScore(true);

    try {
      const endpoint = editingScoreId
        ? `/api/v1/scores/${editingScoreId}`
        : "/api/v1/scores";
      const method = editingScoreId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          score: nextValue,
          playedAt: scoreDate,
        }),
      });

      const result = await readJson(response);

      if (!response.ok) {
        showMessage(result.message ?? "Unable to save score.");
        return;
      }

      setScores((result.data?.last5Scores ?? []) as DashboardScore[]);
      setEditingScoreId(null);
      setScoreValue("32");
      setScoreDate(new Date().toISOString().slice(0, 10));
      showMessage(editingScoreId ? "Score updated successfully." : "Score saved.");
    } catch {
      showMessage("Unable to save score right now.");
    } finally {
      setSavingScore(false);
    }
  }

  async function handleDeleteScore(scoreId: string) {
    if (user?.subscription.status !== "active") {
      showMessage("Subscribe first to manage scores.");
      return;
    }

    try {
      const response = await fetch(`/api/v1/scores/${scoreId}`, {
        method: "DELETE",
      });
      const result = await readJson(response);

      if (!response.ok) {
        showMessage(result.message ?? "Unable to delete score.");
        return;
      }

      setScores((result.data?.last5Scores ?? []) as DashboardScore[]);
      if (editingScoreId === scoreId) {
        setEditingScoreId(null);
        setScoreValue("32");
        setScoreDate(new Date().toISOString().slice(0, 10));
      }
      showMessage("Score removed.");
    } catch {
      showMessage("Unable to delete score right now.");
    }
  }

  function startEditingScore(score: DashboardScore) {
    setEditingScoreId(score.id);
    setScoreValue(String(score.score));
    setScoreDate(score.playedAt);
  }

  async function handleSaveCharity() {
    if (!user || !selectedCharityId) {
      return;
    }

    setSavingCharity(true);

    try {
      const subscriptionAmount =
        user.subscription.plan === "yearly"
          ? user.subscription.yearlyPrice
          : user.subscription.monthlyPrice;

      const response = await fetch("/api/v1/user-charity-selection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          charityId: selectedCharityId,
          contributionPercent,
          subscriptionAmount,
        }),
      });

      const result = await readJson(response);

      if (!response.ok) {
        showMessage(result.message ?? "Unable to save charity selection.");
        return;
      }

      setUser((current) =>
        current
          ? {
              ...current,
              charityId: selectedCharityId,
              charityContributionPercent: contributionPercent,
            }
          : current,
      );
      showMessage("Charity settings saved.");
    } catch {
      showMessage("Unable to save charity settings right now.");
    } finally {
      setSavingCharity(false);
    }
  }

  async function handleSaveProfile() {
    if (!user) {
      return;
    }

    setSavingProfile(true);

    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
        }),
      });

      const result = await readJson(response);

      if (!response.ok) {
        showMessage(result.message ?? "Unable to save profile.");
        return;
      }

      setUser((current) =>
        current
          ? {
              ...current,
              fullName,
              email,
            }
          : current,
      );
      showMessage("Profile updated.");
    } catch {
      showMessage("Unable to update profile right now.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUploadProof(winningId: string) {
    if (!proofUrl) {
      showMessage("Add a proof URL before submitting.");
      return;
    }

    setSavingProofFor(winningId);

    try {
      const response = await fetch(`/api/v1/winnings/${winningId}/verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proofFileUrl: proofUrl,
          notes: proofNotes,
        }),
      });

      const result = await readJson(response);

      if (!response.ok) {
        showMessage(result.message ?? "Unable to upload proof.");
        return;
      }

      setProofUrl("");
      setProofNotes("");
      await loadDashboard();
      showMessage("Winner proof submitted.");
    } catch {
      showMessage("Unable to upload proof right now.");
    } finally {
      setSavingProofFor(null);
    }
  }

  async function handleSubscribe(plan: "monthly" | "yearly") {
    setStartingCheckoutPlan(plan);

    try {
      const response = await fetch("/api/v1/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const result = await readJson(response);

      if (!response.ok) {
        showMessage(result.message ?? "Unable to start subscription checkout.");
        return;
      }

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      }
    } catch {
      showMessage("Unable to start subscription checkout.");
    } finally {
      setStartingCheckoutPlan(null);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#07101e_0%,#0b1424_26%,#eef3f8_26%,#eef3f8_100%)]">
        <SiteHeader />
        <main className="mx-auto flex min-h-[70vh] w-full max-w-[1500px] items-center justify-center px-6 py-12 lg:px-10">
          <div className="rounded-[34px] border border-white/10 bg-white/90 px-8 py-6 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            Loading your subscriber dashboard...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#07101e_0%,#0b1424_26%,#eef3f8_26%,#eef3f8_100%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1500px] px-6 py-12 lg:px-10">
        <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.92),rgba(11,20,36,0.84))] p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="orb orb-cyan left-10 top-8" />
            <div className="orb orb-lime right-16 top-20" />
          </div>

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
                Subscriber dashboard
              </p>
              <div>
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  Welcome back, {user.fullName}.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Manage profile settings, update your latest five scores, pick
                  your charity recipient, and track your draw participation in
                  one place.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Plan", value: user.subscription.plan },
                { label: "Status", value: user.subscription.status },
                { label: "Renews", value: user.subscription.renewalDate },
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass-card rounded-[28px] px-5 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold capitalize text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 lg:grid-cols-4">
            {[
              { label: "Draws entered", value: String(user.drawsEntered) },
              { label: "Upcoming draws", value: String(user.upcomingDraws) },
              { label: "Total won", value: formatCurrency(user.winnings.totalWon) },
              { label: "Current payment status", value: currentPaymentStatus },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-5"
              >
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {user.subscription.status !== "active" ? (
          <section className="mt-8 rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
              Subscription required
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Activate your membership to unlock scores and draw participation
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              Your account is active, but premium gameplay features stay locked
              until you start a monthly or yearly Stripe subscription.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[
                {
                  plan: "monthly" as const,
                  title: "Monthly plan",
                  price: formatCurrency(user.subscription.monthlyPrice),
                },
                {
                  plan: "yearly" as const,
                  title: "Yearly plan",
                  price: formatCurrency(user.subscription.yearlyPrice),
                },
              ].map((planCard) => (
                <div
                  key={planCard.plan}
                  className="rounded-[30px] border border-slate-200 bg-slate-50 p-6"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    {planCard.title}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-slate-950">
                    {planCard.price}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleSubscribe(planCard.plan)}
                    disabled={startingCheckoutPlan !== null}
                    className="mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                  >
                    {startingCheckoutPlan === planCard.plan
                      ? "Redirecting..."
                      : `Subscribe ${planCard.plan}`}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {showToast ? (
          <div className="fixed bottom-6 right-6 z-30 max-w-sm rounded-3xl bg-slate-950 px-5 py-4 text-sm text-white shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
            {toastMessage}
          </div>
        ) : null}

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
          <div className="space-y-6">
            <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Profile and settings
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Manage your subscriber details
              </h2>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="hover-lift mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </article>

            {prizePool ? (
              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Prize pool breakdown
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Current 5-match, 4-match, and 3-match pools
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "5-match", value: formatCurrency(prizePool.tiers.match5) },
                    { label: "4-match", value: formatCurrency(prizePool.tiers.match4) },
                    { label: "3-match", value: formatCurrency(prizePool.tiers.match3) },
                    {
                      label: "Next rollover",
                      value: formatCurrency(prizePool.nextJackpotRollover),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-5"
                    >
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-slate-950">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                    Score management
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    Enter or edit your last five rounds
                  </h2>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white">
                  Rolling retention
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Score</span>
                  <input
                    type="number"
                    min={1}
                    max={45}
                    value={scoreValue}
                    onChange={(event) => handleScoreValueChange(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Date</span>
                  <input
                    type="date"
                    value={scoreDate}
                    onChange={(event) => setScoreDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition [color-scheme:light] focus:border-slate-950"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSaveScore}
                  disabled={savingScore || user.subscription.status !== "active"}
                  className="hover-lift mt-auto rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-5 py-3 text-sm font-semibold text-slate-950"
                >
                  {savingScore
                    ? "Saving..."
                    : editingScoreId
                      ? "Update score"
                      : "Add score"}
                </button>
              </div>

              {editingScoreId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingScoreId(null);
                    setScoreValue("32");
                    setScoreDate(new Date().toISOString().slice(0, 10));
                  }}
                  className="mt-4 text-sm font-medium text-slate-600 underline underline-offset-4"
                >
                  Cancel editing
                </button>
              ) : null}

              <div className="mt-8 grid gap-3">
                {user.subscription.status !== "active" ? (
                  <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50 px-5 py-6 text-sm text-amber-800">
                    Score entry unlocks after subscription. Choose a monthly or yearly plan above.
                  </div>
                ) : null}
                {scores.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-600">
                    No scores yet. Add your first Stableford round above.
                  </div>
                ) : null}

                {scores.map((score, index) => (
                  <div
                    key={score.id}
                    className="reveal-up rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                          Round date
                        </p>
                        <p className="mt-1 font-medium text-slate-900">{score.playedAt}</p>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingScore(score)}
                            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteScore(score.id)}
                            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                        <div className="float-card flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] text-xl font-semibold text-slate-950">
                          {score.score}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                    Participation and winnings
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    Track your draw journey
                  </h2>
                </div>
                <span className="pulse-soft rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  {user.subscription.status === "active" ? "Eligible now" : "Renew to rejoin"}
                </span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                    Participation summary
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                      Draws entered: {user.drawsEntered}
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                      Upcoming draws: {user.upcomingDraws}
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                      Total won: {formatCurrency(user.winnings.totalWon)}
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                      Current payment status:{" "}
                      <span className="font-semibold capitalize">{currentPaymentStatus}</span>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                      Paid amount: {formatCurrency(user.winnings.paidAmount)}
                    </div>
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
                      Pending amount: {formatCurrency(user.winnings.pendingAmount)}
                    </div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    Quick actions
                  </p>
                  <div className="mt-4 grid gap-2">
                    {quickActions.map((action) => (
                      <div
                        key={action}
                        className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700"
                      >
                        {action}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3">
                {winnings.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm text-slate-600">
                    No winnings yet. Your future matches and payout states will appear here.
                  </div>
                ) : (
                  winnings.map((winning) => {
                    const winningId = winning._id ?? winning.id ?? "";
                    const hasPendingPayment = winning.paymentStatus === "pending";

                    return (
                      <button
                        key={winningId}
                        type="button"
                        onClick={() => setSelectedWinningId(hasPendingPayment ? winningId : null)}
                        className={`rounded-[28px] border bg-slate-50 p-5 text-left transition ${
                          selectedWinningId === winningId
                            ? "border-slate-950 bg-slate-100"
                            : "border-slate-200 hover:border-slate-300"
                        } ${!hasPendingPayment ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-slate-950">
                              {formatTierLabel(winning.tier)}
                            </p>
                            <p className="text-sm text-slate-500">
                              Draw month: {winning.drawMonth}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-slate-950">
                              {formatCurrency(winning.amount)}
                            </p>
                            <p className="text-sm text-slate-500">
                              {winning.paymentStatus} / {winning.verificationStatus}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                          <p className="text-sm text-slate-700">
                            Proof uploaded: {winning.proofUploaded ? "Yes" : "No"}
                          </p>
                          {winning.verification?.proofFileUrl ? (
                            <p className="mt-2 text-sm text-slate-600">
                              Proof URL: {winning.verification.proofFileUrl}
                            </p>
                          ) : null}
                        </div>

                        {hasPendingPayment && (
                          <div className="mt-3 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                            Click to upload winner proof →
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Charity selection
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Select your charity recipient
              </h2>

              <div className="mt-6 space-y-4">
                {charities.map((charity) => {
                  const active = charity.id === selectedCharityId;

                  return (
                    <button
                      type="button"
                      key={charity.id}
                      onClick={() => setSelectedCharityId(charity.id)}
                      className={`hover-lift w-full rounded-3xl border p-5 text-left transition ${
                        active
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-950 hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{charity.name}</p>
                          <p className={active ? "text-slate-300" : "text-slate-500"}>
                            {charity.impactMetric}
                          </p>
                        </div>
                        <span className="rounded-full border border-current/20 px-3 py-1 text-xs uppercase tracking-[0.24em]">
                          {charity.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[30px] bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] p-6 text-slate-950">
                <p className="text-sm uppercase tracking-[0.24em]">Selected charity</p>
                <p className="mt-2 text-2xl font-semibold">
                  {selectedCharity?.name ?? "Choose a charity"}
                </p>
                <p className="mt-2 text-sm opacity-70">
                  Estimated contribution this cycle: {formatCurrency(estimatedContribution)}
                </p>
                <div className="mt-5">
                  <label className="text-sm font-medium">
                    Contribution percentage: {formatPercent(contributionPercent)}
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={1}
                    value={contributionPercent}
                    onChange={(event) => setContributionPercent(Number(event.target.value))}
                    className="mt-3 w-full accent-slate-950"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveCharity}
                  disabled={savingCharity || !selectedCharityId}
                  className="hover-lift mt-5 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  {savingCharity ? "Saving..." : "Save charity settings"}
                </button>
              </div>
            </article>

            <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Membership snapshot
              </p>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Subscription plan:{" "}
                  <span className="font-semibold capitalize">{user.subscription.plan}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Access status:{" "}
                  <span className="font-semibold capitalize">{user.subscription.status}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Renewal date: <span className="font-semibold">{user.subscription.renewalDate}</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Current contribution:{" "}
                  <span className="font-semibold">{formatPercent(contributionPercent)}</span>
                </div>
              </div>
            </article>

            {selectedWinningId && winnings.find((w) => (w._id ?? w.id) === selectedWinningId) ? (
              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      Winner verification
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      Upload proof
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWinningId(null);
                      setProofUrl("");
                      setProofNotes("");
                    }}
                    className="text-xl font-light text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                {(() => {
                  const winning = winnings.find((w) => (w._id ?? w.id) === selectedWinningId);
                  return (
                    <>
                      <div className="mb-6 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-700">
                          {formatTierLabel(winning?.tier ?? "match3")} • {winning?.drawMonth}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                          {formatCurrency(winning?.amount ?? 0)}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Proof URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/proof.jpg"
                            value={proofUrl}
                            onChange={(event) => setProofUrl(event.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                          />
                          <p className="mt-1 text-xs text-slate-500">
                            Upload image or document proof of winning ticket
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Notes (optional)
                          </label>
                          <textarea
                            placeholder="Add any details for admin review..."
                            value={proofNotes}
                            onChange={(event) => setProofNotes(event.target.value)}
                            className="min-h-20 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 resize-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleUploadProof(selectedWinningId)}
                          disabled={savingProofFor === selectedWinningId || !proofUrl}
                          className="hover-lift w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingProofFor === selectedWinningId ? "Uploading..." : "Submit proof"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWinningId(null);
                            setProofUrl("");
                            setProofNotes("");
                          }}
                          className="w-full text-sm font-medium text-slate-600 py-2 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  );
                })()}
              </article>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
