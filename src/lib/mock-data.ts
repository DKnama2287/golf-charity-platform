import type { Charity, UserProfile } from "@/lib/types";

export const charities: Charity[] = [
  {
    id: "charity-1",
    name: "First Swing Futures",
    category: "Youth Access",
    region: "United Kingdom",
    description:
      "Funding junior coaching, transport, and local community golf introductions for underrepresented players.",
    impactMetric: "118 young golfers funded this quarter",
    upcomingEvent: "April Charity Pro-Am in Leeds",
    featured: true,
  },
  {
    id: "charity-2",
    name: "Fairways For Recovery",
    category: "Mental Health",
    region: "Ireland",
    description:
      "Pairing outdoor golf-based therapy days with licensed support for adults recovering from burnout and trauma.",
    impactMetric: "72 therapy rounds sponsored this season",
    upcomingEvent: "May wellbeing scramble in Dublin",
    featured: true,
  },
  {
    id: "charity-3",
    name: "Green Grants Alliance",
    category: "Club Sustainability",
    region: "Europe",
    description:
      "Supporting water-conscious course upgrades and volunteer-led habitat restoration at grassroots clubs.",
    impactMetric: "14 eco-grants distributed this year",
    upcomingEvent: "June sustainability showcase",
    featured: false,
  },
];

export const users: UserProfile[] = [
  {
    id: "user-1",
    name: "Mia Thompson",
    email: "mia@birdiefund.com",
    handicap: 14,
    charityId: "charity-2",
    charityContributionPercent: 18,
    drawsEntered: 7,
    upcomingDraws: 1,
    winnings: {
      totalWon: 640,
      pendingAmount: 220,
      paidAmount: 420,
    },
    subscription: {
      plan: "yearly",
      status: "active",
      renewalDate: "2026-09-18",
      monthlyPrice: 19,
      yearlyPrice: 149,
    },
    scores: [
      { id: "mia-1", value: 35, date: "2026-03-16" },
      { id: "mia-2", value: 31, date: "2026-03-08" },
      { id: "mia-3", value: 28, date: "2026-02-26" },
      { id: "mia-4", value: 34, date: "2026-02-12" },
      { id: "mia-5", value: 30, date: "2026-01-29" },
    ],
  },
  {
    id: "user-2",
    name: "Leo Carter",
    email: "leo@birdiefund.com",
    handicap: 9,
    charityId: "charity-1",
    charityContributionPercent: 12,
    drawsEntered: 4,
    upcomingDraws: 1,
    winnings: {
      totalWon: 180,
      pendingAmount: 0,
      paidAmount: 180,
    },
    subscription: {
      plan: "monthly",
      status: "active",
      renewalDate: "2026-04-02",
      monthlyPrice: 19,
      yearlyPrice: 149,
    },
    scores: [
      { id: "leo-1", value: 38, date: "2026-03-19" },
      { id: "leo-2", value: 35, date: "2026-03-11" },
      { id: "leo-3", value: 33, date: "2026-03-03" },
      { id: "leo-4", value: 29, date: "2026-02-20" },
      { id: "leo-5", value: 31, date: "2026-02-11" },
    ],
  },
  {
    id: "user-3",
    name: "Anaya Shah",
    email: "anaya@birdiefund.com",
    handicap: 18,
    charityId: "charity-3",
    charityContributionPercent: 20,
    drawsEntered: 9,
    upcomingDraws: 1,
    winnings: {
      totalWon: 1020,
      pendingAmount: 420,
      paidAmount: 600,
    },
    subscription: {
      plan: "yearly",
      status: "active",
      renewalDate: "2026-12-01",
      monthlyPrice: 19,
      yearlyPrice: 149,
    },
    scores: [
      { id: "anaya-1", value: 27, date: "2026-03-20" },
      { id: "anaya-2", value: 31, date: "2026-03-05" },
      { id: "anaya-3", value: 35, date: "2026-02-24" },
      { id: "anaya-4", value: 24, date: "2026-02-09" },
      { id: "anaya-5", value: 33, date: "2026-01-30" },
    ],
  },
];
