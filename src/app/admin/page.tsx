"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency } from "@/lib/platform";

interface AdminSummary {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePool: number;
  charityContributionTotal: number;
  pendingVerifications: number;
  drawStats: {
    totalDraws: number;
    publishedDraws: number;
    simulationRuns: number;
    readyToPublish: number;
    totalWinners: number;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  charityId: string;
}

interface AdminCharity {
  id: string;
  name: string;
  category: string;
  upcomingEvent: string;
  totalDonations: number;
  supporterCount: number;
  imageUrl?: string;
  websiteUrl?: string;
  impactMetric?: string;
  featured?: boolean;
}

interface AdminVerification {
  id: string;
  winningId?: string;
  userName: string;
  status: string;
  notes: string;
  proofFileUrl?: string;
  rejectionReason?: string;
  tier?: string;
  amount?: number;
  paymentStatus?: string;
}

interface AdminDraw {
  id: string;
  drawMonth: string;
  mode: string;
  numbers: number[];
  isSimulation: boolean;
  published: boolean;
  participantCount: number;
}

interface AdminWinner {
  id: string;
  userName: string;
  tier: string;
  amount: number;
  drawMonth: string;
  paymentStatus: string;
  verificationStatus: string;
}

interface AdminUserScore {
  id: string;
  score: number;
  playedAt: string;
}

interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  subscription: {
    plan: string;
    status: string;
  };
  scores: AdminUserScore[];
  winnings: AdminWinner[];
}

interface PrizePoolSummary {
  activeSubscriberCount: number;
  totalRevenue: number;
  previousJackpotRollover: number;
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

const adminNav = [
  { id: "overview", label: "Overview" },
  { id: "draws", label: "Draws" },
  { id: "users", label: "Users" },
  { id: "verifications", label: "Verifications" },
  { id: "charities", label: "Charities" },
  { id: "reports", label: "Reports" },
  { id: "register", label: "Register" },
] as const;

type AdminSection = (typeof adminNav)[number]["id"];

export default function AdminPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [prizePool, setPrizePool] = useState<PrizePoolSummary | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [charities, setCharities] = useState<AdminCharity[]>([]);
  const [verifications, setVerifications] = useState<AdminVerification[]>([]);
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [adminWinnings, setAdminWinnings] = useState<AdminWinner[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDetail | null>(null);
  const [drawMode, setDrawMode] = useState<"random" | "weighted">("random");
  const [runningDraw, setRunningDraw] = useState<null | "simulate" | "run">(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [newCharityName, setNewCharityName] = useState("");
  const [newCharityCategory, setNewCharityCategory] = useState("");
  const [newCharitySlug, setNewCharitySlug] = useState("");
  const [newCharityEvent, setNewCharityEvent] = useState("");
  const [newCharityImpact, setNewCharityImpact] = useState("");
  const [newCharityImageUrl, setNewCharityImageUrl] = useState("");
  const [newCharityWebsiteUrl, setNewCharityWebsiteUrl] = useState("");
  const [newCharityFeatured, setNewCharityFeatured] = useState(false);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [savingAdminAccount, setSavingAdminAccount] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [savingCharity, setSavingCharity] = useState(false);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [savingAdminScoreId, setSavingAdminScoreId] = useState<string | null>(null);
  const [editingAdminScoreId, setEditingAdminScoreId] = useState<string | null>(null);
  const [adminScoreValue, setAdminScoreValue] = useState("32");
  const [adminScoreDate, setAdminScoreDate] = useState(new Date().toISOString().slice(0, 10));
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [loading, setLoading] = useState(true);

  async function loadAdmin() {
      try {
        const [summaryResponse, prizePoolResponse, usersResponse, charitiesResponse, verificationsResponse, drawsResponse, winningsResponse] =
          await Promise.all([
            fetch("/api/v1/admin/reports/summary", { cache: "no-store" }),
            fetch("/api/v1/prize-pool", { cache: "no-store" }),
            fetch("/api/v1/admin/users", { cache: "no-store" }),
            fetch("/api/v1/admin/charities", { cache: "no-store" }),
            fetch("/api/v1/admin/verifications", { cache: "no-store" }),
            fetch("/api/v1/admin/draws", { cache: "no-store" }),
            fetch("/api/v1/admin/winnings", { cache: "no-store" }),
          ]);

        const [summaryResult, prizePoolResult, usersResult, charitiesResult, verificationsResult, drawsResult, winningsResult] =
          await Promise.all([
            readJson(summaryResponse),
            readJson(prizePoolResponse),
            readJson(usersResponse),
            readJson(charitiesResponse),
            readJson(verificationsResponse),
            readJson(drawsResponse),
            readJson(winningsResponse),
          ]);

        if (!summaryResponse.ok) {
          window.location.href = "/login?role=admin";
          return;
        }

        setSummary(summaryResult.data as AdminSummary);
        setPrizePool((prizePoolResult.data ?? null) as PrizePoolSummary | null);
        setUsers(
          ((usersResult.data ?? []) as Array<Record<string, unknown>>).map((user) => ({
            id: String(user._id ?? user.id ?? ""),
            name: String(user.name ?? ""),
            email: String(user.email ?? ""),
            plan: String((user.subscription as Record<string, unknown> | undefined)?.plan ?? "monthly"),
            status: String((user.subscription as Record<string, unknown> | undefined)?.status ?? "inactive"),
            charityId: String(user.charityId ?? ""),
          })),
        );
        setCharities(
          ((charitiesResult.data ?? []) as Array<Record<string, unknown>>).map((charity) => ({
            id: String(charity._id ?? charity.id ?? ""),
            name: String(charity.name ?? ""),
            category: String(charity.category ?? ""),
            upcomingEvent: String(charity.upcomingEvent ?? ""),
            totalDonations: Number(charity.totalDonations ?? 0),
            supporterCount: Number(charity.supporterCount ?? 0),
            imageUrl: String(charity.imageUrl ?? ""),
            websiteUrl: String(charity.websiteUrl ?? ""),
            impactMetric: String(charity.impactMetric ?? ""),
            featured: Boolean(charity.featured),
          })),
        );
        setVerifications(
          ((verificationsResult.data ?? []) as Array<Record<string, unknown>>).map(
            (verification) => ({
              id: String(verification._id ?? verification.id ?? ""),
              winningId: String(verification.winningId ?? ""),
              userName: String(verification.userName ?? "Pending winner"),
              status: String(verification.status ?? "pending"),
              notes: String(verification.notes ?? ""),
              proofFileUrl: String(verification.proofFileUrl ?? ""),
              rejectionReason: String(verification.rejectionReason ?? ""),
              tier: String(
                (verification.winning as Record<string, unknown> | undefined)?.tier ?? "",
              ),
              amount: Number(
                (verification.winning as Record<string, unknown> | undefined)?.amount ?? 0,
              ),
              paymentStatus: String(
                (verification.winning as Record<string, unknown> | undefined)?.paymentStatus ??
                  "pending",
              ),
            }),
          ),
        );
        setDraws(
          ((drawsResult.data ?? []) as Array<Record<string, unknown>>).map((draw) => ({
            id: String(draw._id ?? draw.id ?? ""),
            drawMonth: String(draw.drawMonth ?? ""),
            mode: String(draw.mode ?? "random"),
            numbers: (draw.numbers as number[] | undefined) ?? [],
            isSimulation: Boolean(draw.isSimulation),
            published: Boolean(draw.published),
            participantCount: Number(draw.participantCount ?? 0),
          })),
        );
        setAdminWinnings(
          ((winningsResult.data ?? []) as Array<Record<string, unknown>>).map((winning) => ({
            id: String(winning._id ?? winning.id ?? ""),
            userName: String(winning.userName ?? ""),
            tier: String(winning.tier ?? ""),
            amount: Number(winning.amount ?? 0),
            drawMonth: String(winning.drawMonth ?? ""),
            paymentStatus: String(winning.paymentStatus ?? "pending"),
            verificationStatus: String(winning.verificationStatus ?? "pending"),
          })),
        );
      } catch {
        window.location.href = "/login?role=admin";
      } finally {
        setLoading(false);
      }
  }

  useEffect(() => {
    void loadAdmin();
  }, []);

  const topCharities = useMemo(
    () => charities.slice().sort((a, b) => b.totalDonations - a.totalDonations).slice(0, 4),
    [charities],
  );

  const activeSectionLabel =
    adminNav.find((item) => item.id === activeSection)?.label ?? "Overview";

  async function handleDrawAction(action: "simulate" | "run") {
    setRunningDraw(action);

    try {
      const response = await fetch(`/api/v1/draws/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: drawMode,
        }),
      });

      if (response.ok) {
        await loadAdmin();
      }
    } finally {
      setRunningDraw(null);
    }
  }

  async function handlePublishDraw(drawId: string) {
    const response = await fetch(`/api/v1/draws/${drawId}/publish`, {
      method: "POST",
    });

    if (response.ok) {
      await loadAdmin();
    }
  }

  async function handleUserUpdate(userId: string, payload: {
    subscriptionPlan?: "monthly" | "yearly";
    subscriptionStatus?: "active" | "inactive" | "lapsed" | "cancelled";
  }) {
    setSavingUserId(userId);

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadAdmin();
      }
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleSelectUser(userId: string) {
    setLoadingUserDetail(true);

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        cache: "no-store",
      });
      const result = await readJson(response);

      if (!response.ok) {
        return;
      }

      const data = result.data as {
        user: Record<string, unknown>;
        scores: Array<Record<string, unknown>>;
        winnings: Array<Record<string, unknown>>;
      };

      setSelectedUserDetail({
        id: String(data.user._id ?? data.user.id ?? ""),
        name: String(data.user.name ?? ""),
        email: String(data.user.email ?? ""),
        role: String(data.user.role ?? "user"),
        subscription: {
          plan: String((data.user.subscription as Record<string, unknown> | undefined)?.plan ?? "monthly"),
          status: String((data.user.subscription as Record<string, unknown> | undefined)?.status ?? "inactive"),
        },
        scores: (data.scores ?? []).map((score) => ({
          id: String(score._id ?? score.id ?? ""),
          score: Number(score.score ?? 0),
          playedAt: String(score.playedAt ?? ""),
        })),
        winnings: (data.winnings ?? []).map((winning) => ({
          id: String(winning._id ?? winning.id ?? ""),
          userName: String(winning.userName ?? ""),
          tier: String(winning.tier ?? ""),
          amount: Number(winning.amount ?? 0),
          drawMonth: String(winning.drawMonth ?? ""),
          paymentStatus: String(winning.paymentStatus ?? "pending"),
          verificationStatus: String(winning.verificationStatus ?? "pending"),
        })),
      });
    } finally {
      setLoadingUserDetail(false);
    }
  }

  async function handleVerificationAction(
    verificationId: string,
    status: "approved" | "rejected",
  ) {
    const response = await fetch(`/api/v1/admin/verifications/${verificationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        rejectionReason: status === "rejected" ? "Rejected by admin review." : "",
      }),
    });

    if (response.ok) {
      await loadAdmin();
    }
  }

  async function handleMarkPaid(winningId?: string) {
    if (!winningId) return;

    const response = await fetch(`/api/v1/admin/winnings/${winningId}/pay`, {
      method: "POST",
    });

    if (response.ok) {
      await loadAdmin();
    }
  }

  async function handleCreateCharity() {
    if (!newCharityName || !newCharityCategory || !newCharitySlug) {
      return;
    }

    setSavingCharity(true);

    try {
      const response = await fetch("/api/v1/admin/charities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCharityName,
          slug: newCharitySlug,
          category: newCharityCategory,
          description: "",
          websiteUrl: newCharityWebsiteUrl,
          imageUrl: newCharityImageUrl,
          impactMetric: newCharityImpact,
          upcomingEvent: newCharityEvent,
          isFeatured: newCharityFeatured,
        }),
      });

      if (response.ok) {
        setNewCharityName("");
        setNewCharityCategory("");
        setNewCharitySlug("");
        setNewCharityEvent("");
        setNewCharityImpact("");
        setNewCharityImageUrl("");
        setNewCharityWebsiteUrl("");
        setNewCharityFeatured(false);
        await loadAdmin();
      }
    } finally {
      setSavingCharity(false);
    }
  }

  async function handleUpdateCharity(
    charityId: string,
    payload: Record<string, unknown>,
  ) {
    const response = await fetch(`/api/v1/admin/charities/${charityId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      await loadAdmin();
    }
  }

  async function handleDeleteCharity(charityId: string) {
    const response = await fetch(`/api/v1/admin/charities/${charityId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      await loadAdmin();
    }
  }

  async function handleAdminScoreSave() {
    if (!selectedUserDetail || !editingAdminScoreId) {
      return;
    }

    setSavingAdminScoreId(editingAdminScoreId);

    try {
      const response = await fetch(
        `/api/v1/admin/users/${selectedUserDetail.id}/scores/${editingAdminScoreId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            score: Number(adminScoreValue),
            playedAt: adminScoreDate,
          }),
        },
      );

      const result = await readJson(response);

      if (!response.ok) {
        return;
      }

      setSelectedUserDetail({
        ...selectedUserDetail,
        scores: ((result.data?.scores ?? []) as Array<Record<string, unknown>>).map((score) => ({
          id: String(score._id ?? score.id ?? ""),
          score: Number(score.score ?? 0),
          playedAt: String(score.playedAt ?? ""),
        })),
      });
      setEditingAdminScoreId(null);
      await loadAdmin();
    } finally {
      setSavingAdminScoreId(null);
    }
  }

  async function handleCreateAdminAccount() {
    setAdminError("");
    setAdminSuccess("");

    // Validation
    if (!newAdminName.trim()) {
      setAdminError("Please enter admin full name");
      return;
    }
    if (!newAdminEmail.trim()) {
      setAdminError("Please enter admin email address");
      return;
    }
    if (!newAdminPassword.trim()) {
      setAdminError("Please enter a temporary password");
      return;
    }
    if (newAdminPassword.length < 6) {
      setAdminError("Password must be at least 6 characters");
      return;
    }

    setSavingAdminAccount(true);

    try {
      const response = await fetch("/api/v1/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: newAdminName,
          email: newAdminEmail,
          password: newAdminPassword,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setAdminSuccess("✓ Admin account created successfully!");
        setNewAdminName("");
        setNewAdminEmail("");
        setNewAdminPassword("");

        // Clear success message after 3 seconds
        setTimeout(() => setAdminSuccess(""), 3000);

        await loadAdmin();
      } else {
        setAdminError(responseData.message || responseData.error || "Failed to create admin account");
      }
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Network error occurred");
    } finally {
      setSavingAdminAccount(false);
    }
  }

  if (loading || !summary) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#08101d_0%,#091321_32%,#f8fafc_32%,#f8fafc_100%)]">
        <SiteHeader />
        <main className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-6 py-12 lg:px-10">
          <div className="rounded-[34px] border border-white/10 bg-white/90 px-8 py-6 text-slate-700 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
            Loading your admin dashboard...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#08101d_0%,#091321_32%,#f8fafc_32%,#f8fafc_100%)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
        <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,18,0.94),rgba(11,20,36,0.88))] p-8 text-white shadow-[0_30px_100px_rgba(0,0,0,0.36)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="orb orb-cyan left-10 top-8" />
            <div className="orb orb-violet right-10 top-16" />
          </div>

          <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">
                Administrator controls
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Manage users, charities, draws, and winner approvals.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                This panel is protected for admin login only and gives a clean
                working view of platform health and operational tasks.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Total users", value: String(summary.totalUsers) },
                { label: "Prize pool", value: formatCurrency(summary.totalPrizePool) },
                {
                  label: "Charity total",
                  value: formatCurrency(summary.charityContributionTotal),
                },
              ].map((item) => (
                <div key={item.label} className="glass-card rounded-[28px] px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Navigation</p>
            <div className="mt-5 grid gap-2">
              {adminNav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                    activeSection === item.id
                      ? "bg-slate-950 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-950 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Active workspace
              </p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
                    {activeSectionLabel}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    The left navigation now switches between focused admin views, so only the
                    selected control area is shown here.
                  </p>
                </div>
                {prizePool ? (
                  <div className="rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                    Live prize pool: {formatCurrency(prizePool.totalPrizePool)}
                  </div>
                ) : null}
              </div>
            </section>

            {activeSection === "overview" ? (
            <section id="overview" className="grid gap-6 xl:grid-cols-3">
              {[
                { label: "Active subscribers", value: summary.activeSubscribers },
                { label: "Pending verifications", value: summary.pendingVerifications },
                { label: "Live charities", value: charities.length },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-slate-950">
                    {item.value}
                  </p>
                </article>
              ))}
            </section>
            ) : null}

            {activeSection === "overview" ? (
            <section className="grid gap-6 xl:grid-cols-4">
              {[
                { label: "Total draws", value: summary.drawStats.totalDraws },
                { label: "Published draws", value: summary.drawStats.publishedDraws },
                { label: "Simulation runs", value: summary.drawStats.simulationRuns },
                { label: "Total winners", value: summary.drawStats.totalWinners },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
                >
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-slate-950">{item.value}</p>
                </article>
              ))}
            </section>
            ) : null}

            {activeSection === "overview" && prizePool ? (
              <section className="grid gap-6 xl:grid-cols-4">
                {[
                  { label: "5-match pool", value: formatCurrency(prizePool.tiers.match5) },
                  { label: "4-match pool", value: formatCurrency(prizePool.tiers.match4) },
                  { label: "3-match pool", value: formatCurrency(prizePool.tiers.match3) },
                  { label: "Jackpot rollover", value: formatCurrency(prizePool.nextJackpotRollover) },
                ].map((item) => (
                  <article
                    key={item.label}
                    className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
                  >
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{item.value}</p>
                  </article>
                ))}
              </section>
            ) : null}

            {activeSection === "draws" ? (
            <section id="draws" className="grid gap-6">
              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      Draw control
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Configure and run draws
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Draw mode</span>
                    <select
                      value={drawMode}
                      onChange={(event) =>
                        setDrawMode(event.target.value as "random" | "weighted")
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none"
                    >
                      <option value="random">Random</option>
                      <option value="weighted">Algorithm / weighted</option>
                    </select>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleDrawAction("simulate")}
                      disabled={runningDraw !== null}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      {runningDraw === "simulate" ? "Simulating..." : "Simulate Draw"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDrawAction("run")}
                      disabled={runningDraw !== null}
                      className="rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-4 py-3 text-sm font-semibold text-slate-950 hover:shadow-md"
                    >
                      {runningDraw === "run" ? "Running..." : "Run Official Draw"}
                    </button>
                  </div>
                </div>
              </article>

              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      Draw records
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      All draws
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    {draws.length} total
                  </span>
                </div>

                {draws.length === 0 ? (
                  <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
                    No draws have been created yet. Run a draw to get started.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {draws.map((draw) => (
                      <div
                        key={draw.id}
                        className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <p className="text-lg font-semibold text-slate-950">
                              {draw.drawMonth}
                            </p>
                            <p className="text-sm text-slate-600 capitalize mt-1">
                              {draw.mode} {draw.isSimulation ? "simulation" : "official"}
                            </p>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap ${
                            draw.isSimulation
                              ? "bg-blue-100 text-blue-700"
                              : draw.published
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                          }`}>
                            {draw.isSimulation ? "Simulation" : draw.published ? "Published" : "Ready"}
                          </span>
                        </div>

                        <div className="mb-4 rounded-2xl bg-slate-950 p-3">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-2">
                            Draw numbers
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {draw.numbers.map((number) => (
                              <div
                                key={`${draw.id}-${number}`}
                                className="flex h-8 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] text-xs font-bold text-slate-950"
                              >
                                {number}
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mb-3">
                          👥 {draw.participantCount} participant{draw.participantCount !== 1 ? "s" : ""}
                        </p>

                        {!draw.isSimulation && !draw.published ? (
                          <button
                            type="button"
                            onClick={() => handlePublishDraw(draw.id)}
                            className="w-full rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                          >
                            Publish Results
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
            ) : null}

            {activeSection === "users" ? (
            <section id="users" className="grid gap-6">
              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      User management
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Subscriber overview
                    </h2>
                  </div>
                  <div className="text-lg font-semibold text-slate-600">
                    Total: <span className="text-slate-950">{users.length}</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[30px] border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                      <tr className="text-left text-xs text-slate-600">
                        <th className="px-6 py-4 font-semibold uppercase tracking-[0.02em]">User</th>
                        <th className="px-6 py-4 font-semibold uppercase tracking-[0.02em]">Plan</th>
                        <th className="px-6 py-4 font-semibold uppercase tracking-[0.02em]">Status</th>
                        <th className="px-6 py-4 font-semibold uppercase tracking-[0.02em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {users.map((user) => (
                        <tr key={user.id} className="transition hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100">
                          <td className="px-6 py-5">
                            <p className="font-semibold text-slate-950">{user.name}</p>
                            <p className="text-sm text-slate-500 mt-1">{user.email}</p>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200">
                              {user.plan === "monthly" ? "📅 Monthly" : "📆 Yearly"}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            {user.status === "active" ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.02em] text-emerald-700 border border-emerald-200">
                                ✓ {user.status}
                              </span>
                            ) : user.status === "inactive" ? (
                              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.02em] text-amber-700 border border-amber-200">
                                ⊘ {user.status}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.02em] text-slate-700 border border-slate-300">
                                — {user.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleSelectUser(user.id)}
                                className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                Manage
                              </button>
                              <button
                                type="button"
                                disabled={savingUserId === user.id}
                                onClick={() =>
                                  handleUserUpdate(user.id, {
                                    subscriptionPlan:
                                      user.plan === "monthly" ? "yearly" : "monthly",
                                  })
                                }
                                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {savingUserId === user.id ? "..." : "Toggle Plan"}
                              </button>
                              <button
                                type="button"
                                disabled={savingUserId === user.id}
                                onClick={() =>
                                  handleUserUpdate(user.id, {
                                    subscriptionStatus:
                                      user.status === "active" ? "inactive" : "active",
                                  })
                                }
                                className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {savingUserId === user.id ? "..." : "Toggle Status"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </section>
            ) : null}

            {activeSection === "verifications" ? (
            <section id="verifications" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Winner verification
                </p>
                <div className="mt-6 grid gap-3">
                  {verifications.length > 0 ? (
                    verifications.map((verification) => (
                      <div
                        key={verification.id}
                        className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold text-slate-950">
                              {verification.userName}
                            </p>
                            <p className="text-sm text-slate-500">
                              {verification.notes || "Awaiting review"}
                            </p>
                            {verification.tier ? (
                              <p className="mt-1 text-sm text-slate-500">
                                {verification.tier} · {formatCurrency(verification.amount ?? 0)}
                              </p>
                            ) : null}
                            {verification.proofFileUrl ? (
                              <a
                                href={verification.proofFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex text-sm font-medium text-slate-950 underline"
                              >
                                Open score screenshot proof
                              </a>
                            ) : null}
                            {verification.rejectionReason ? (
                              <p className="mt-2 text-sm text-rose-600">
                                Rejection reason: {verification.rejectionReason}
                              </p>
                            ) : null}
                          </div>
                          {verification.status === "pending" ? (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.02em] text-amber-700 border border-amber-200">
                              ⏳ {verification.status}
                            </span>
                          ) : verification.status === "approved" ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.02em] text-emerald-700 border border-emerald-200">
                              ✓ {verification.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.02em] text-rose-700 border border-rose-200">
                              ✕ {verification.status}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerificationAction(verification.id, "approved")}
                            disabled={verification.status !== "pending" || verification.paymentStatus === "paid"}
                            className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200"
                          >
                            {verification.status === "approved" ? "✓ Approved" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVerificationAction(verification.id, "rejected")}
                            disabled={verification.status !== "pending" || verification.paymentStatus === "paid"}
                            className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-200 transition disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500 disabled:hover:bg-slate-200"
                          >
                            {verification.status === "rejected" ? "✕ Rejected" : "Reject"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(verification.winningId)}
                            disabled={
                              verification.status !== "approved" ||
                              verification.paymentStatus === "paid"
                            }
                            className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:hover:bg-slate-300"
                          >
                            {verification.paymentStatus === "paid" ? "✓ Paid" : "Mark Paid"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                      No winner verifications are waiting right now.
                    </div>
                  )}
                </div>
              </article>
              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                  Winners management
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  Full winners list
                </h2>
                <div className="mt-6 grid gap-3">
                  {adminWinnings.length === 0 ? (
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                      No winners have been generated yet.
                    </div>
                  ) : (
                    adminWinnings.slice(0, 12).map((winner) => (
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
                              {winner.tier} · {winner.drawMonth}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-950">
                              {formatCurrency(winner.amount)}
                            </p>
                            <p className="text-sm text-slate-500">
                              {winner.verificationStatus} / {winner.paymentStatus}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>
            ) : null}

            {activeSection === "users" ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      User detail control
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Edit profiles and golf scores
                    </h2>
                  </div>
                  {loadingUserDetail ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
                      Loading
                    </span>
                  ) : null}
                </div>

                {!selectedUserDetail ? (
                  <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                    Select a user from the table above to inspect profile details, subscription state,
                    winnings, and score history.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-lg font-semibold text-slate-950">
                        {selectedUserDetail.name}
                      </p>
                      <p className="text-sm text-slate-500">{selectedUserDetail.email}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                        <span className="rounded-full bg-white px-3 py-2">
                          Role: {selectedUserDetail.role}
                        </span>
                        <span className="rounded-full bg-white px-3 py-2">
                          Plan: {selectedUserDetail.subscription.plan}
                        </span>
                        <span className="rounded-full bg-white px-3 py-2">
                          Status: {selectedUserDetail.subscription.status}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-lg font-semibold text-slate-950">Golf scores</p>
                        {editingAdminScoreId ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              min={1}
                              max={45}
                              value={adminScoreValue}
                              onChange={(event) => setAdminScoreValue(event.target.value)}
                              className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
                            />
                            <input
                              type="date"
                              value={adminScoreDate}
                              onChange={(event) => setAdminScoreDate(event.target.value)}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAdminScoreSave}
                              disabled={savingAdminScoreId !== null}
                              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Save
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-4 grid gap-3">
                        {selectedUserDetail.scores.length === 0 ? (
                          <div className="rounded-2xl bg-white px-4 py-4 text-sm text-slate-600">
                            No scores recorded for this user yet.
                          </div>
                        ) : (
                          selectedUserDetail.scores.map((score) => (
                            <div
                              key={score.id}
                              className="flex items-center justify-between rounded-2xl bg-white px-4 py-4"
                            >
                              <div>
                                <p className="font-semibold text-slate-950">{score.score}</p>
                                <p className="text-sm text-slate-500">{score.playedAt}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAdminScoreId(score.id);
                                  setAdminScoreValue(String(score.score));
                                  setAdminScoreDate(score.playedAt);
                                }}
                                className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
                              >
                                Edit score
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            </section>
            ) : null}

            {activeSection === "charities" ? (
            <section className="grid gap-6">
              <article id="charities" className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      Create new charity
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Add a charity to the platform
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-4 py-2 text-sm font-semibold text-slate-950">
                    Live Create
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Charity name</span>
                    <input
                      type="text"
                      placeholder="e.g., Water Aid International"
                      value={newCharityName}
                      onChange={(event) => setNewCharityName(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Category</span>
                    <input
                      type="text"
                      placeholder="e.g., Education, Healthcare"
                      value={newCharityCategory}
                      onChange={(event) => setNewCharityCategory(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">URL Slug</span>
                    <input
                      type="text"
                      placeholder="e.g., water-aid"
                      value={newCharitySlug}
                      onChange={(event) => setNewCharitySlug(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Upcoming event</span>
                    <input
                      type="text"
                      placeholder="e.g., Spring fundraiser 2026"
                      value={newCharityEvent}
                      onChange={(event) => setNewCharityEvent(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Impact metric</span>
                    <input
                      type="text"
                      placeholder="e.g., Wells installed per $1,000"
                      value={newCharityImpact}
                      onChange={(event) => setNewCharityImpact(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Image URL</span>
                    <input
                      type="url"
                      placeholder="https://example.com/charity-image.jpg"
                      value={newCharityImageUrl}
                      onChange={(event) => setNewCharityImageUrl(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Website URL</span>
                    <input
                      type="url"
                      placeholder="https://example.com"
                      value={newCharityWebsiteUrl}
                      onChange={(event) => setNewCharityWebsiteUrl(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950"
                    />
                  </label>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={newCharityFeatured}
                      onChange={(event) => setNewCharityFeatured(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">Mark as featured charity</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateCharity}
                    disabled={savingCharity}
                    className="hover-lift rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingCharity ? "Creating charity..." : "Create charity"}
                  </button>
                </div>
              </article>

              <article className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      Live charities
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Top charities
                    </h2>
                  </div>
                  <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    {topCharities.length} active
                  </span>
                </div>

                {topCharities.length === 0 ? (
                  <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
                    <p>No charities created yet. Create your first charity above.</p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {topCharities.map((charity) => (
                      <div
                        key={charity.id}
                        className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 transition hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-lg font-semibold text-slate-950 truncate">
                              {charity.name}
                            </p>
                            <span className="mt-1 inline-block rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                              {charity.category}
                            </span>
                          </div>
                          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap ${
                            charity.featured
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {charity.featured ? "Featured" : "Standard"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium text-slate-700">Event:</span> {charity.upcomingEvent || "—"}
                          </p>
                          {charity.impactMetric && (
                            <p className="text-sm text-slate-600">
                              <span className="font-medium text-slate-700">Impact:</span> {charity.impactMetric}
                            </p>
                          )}
                          <div className="mt-3 flex gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              💰 {formatCurrency(charity.totalDonations)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1">
                              👥 {charity.supporterCount}
                            </span>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCharity(charity.id, {
                                isFeatured: !charity.featured,
                              })
                            }
                            className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            {charity.featured ? "Unfeature" : "Feature"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateCharity(charity.id, {
                                upcomingEvent:
                                  window.prompt("Update upcoming event", charity.upcomingEvent) ??
                                  charity.upcomingEvent,
                                imageUrl:
                                  window.prompt("Update image URL", charity.imageUrl ?? "") ??
                                  charity.imageUrl,
                                websiteUrl:
                                  window.prompt("Update website URL", charity.websiteUrl ?? "") ??
                                  charity.websiteUrl,
                                impactMetric:
                                  window.prompt("Update impact metric", charity.impactMetric ?? "") ??
                                  charity.impactMetric,
                              })
                            }
                            className="flex-1 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCharity(charity.id)}
                            className="flex-1 rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </section>
            ) : null}

            {activeSection === "reports" ? (
            <section className="grid gap-6">
              <article id="reports" className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4 mb-8">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      Analytics & Insights
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Platform reports
                    </h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: "Total users", value: `${summary.totalUsers}`, icon: "👥" },
                    { label: "Total prize pool", value: formatCurrency(summary.totalPrizePool), icon: "💰" },
                    { label: "Charity contribution totals", value: formatCurrency(summary.charityContributionTotal), icon: "🤝" },
                    { label: "Ready-to-publish draws", value: `${summary.drawStats.readyToPublish}`, icon: "✓" },
                    { label: "Published draws", value: `${summary.drawStats.publishedDraws}`, icon: "📊" },
                    { label: "Pending verifications", value: `${summary.pendingVerifications}`, icon: "⏳" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm uppercase tracking-[0.24em] text-slate-500 font-medium">
                            {item.label}
                          </p>
                          <p className="mt-3 text-3xl font-bold text-slate-950">
                            {item.value}
                          </p>
                        </div>
                        <span className="text-3xl">{item.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
            ) : null}

            {activeSection === "register" ? (
            <section className="grid gap-6">
              <article id="register" className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                      Access management
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      Register new admin
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-[linear-gradient(135deg,#d6f56b,#63d2ff)] px-4 py-2 text-sm font-semibold text-slate-950">
                    Admin Only
                  </div>
                </div>

                <div className="mt-8 max-w-2xl">
                  <p className="text-base leading-7 text-slate-600 mb-6">
                    Create another admin account to manage the platform. New admin accounts are created with temporary passwords that should be changed on first login. This section is protected and only accessible to existing administrators.
                  </p>

                  {adminError && (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 mb-6">
                      <p className="text-sm font-medium text-rose-700">✕ {adminError}</p>
                    </div>
                  )}

                  {adminSuccess && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-6">
                      <p className="text-sm font-medium text-emerald-700">{adminSuccess}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Full name <span className="text-rose-500">*</span></span>
                      <input
                        type="text"
                        placeholder="e.g., Sarah Johnson"
                        value={newAdminName}
                        onChange={(event) => setNewAdminName(event.target.value)}
                        disabled={savingAdminAccount}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Email address <span className="text-rose-500">*</span></span>
                      <input
                        type="email"
                        placeholder="admin@example.com"
                        value={newAdminEmail}
                        onChange={(event) => setNewAdminEmail(event.target.value)}
                        disabled={savingAdminAccount}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Temporary password (min. 6 characters) <span className="text-rose-500">*</span></span>
                      <input
                        type="password"
                        placeholder="Create a temporary password"
                        value={newAdminPassword}
                        onChange={(event) => setNewAdminPassword(event.target.value)}
                        disabled={savingAdminAccount}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-950 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        💡 Minimum 6 characters required
                      </p>
                      <p className="text-xs text-slate-500">
                        ℹ️ Admin will be prompted to change this password on first login
                      </p>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateAdminAccount}
                    disabled={savingAdminAccount || !newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()}
                    className="hover-lift mt-7 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:bg-slate-400"
                  >
                    {savingAdminAccount ? "Creating admin account..." : "Create admin account"}
                  </button>
                </div>
              </article>
            </section>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
