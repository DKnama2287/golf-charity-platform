import { connectToDatabase } from "@/lib/db/mongodb";
import { CharityModel } from "@/lib/models/charity";

const defaultCharities = [
  {
    name: "First Swing Futures",
    slug: "first-swing-futures",
    category: "Youth Access",
    region: "United Kingdom",
    description:
      "Funding junior coaching, transport, and local community golf introductions for underrepresented players.",
    impactMetric: "118 young golfers funded this quarter",
    upcomingEvent: "April Charity Pro-Am in Leeds",
    featured: true,
    imageUrl: "",
    websiteUrl: "https://birdiefund.local/charities/first-swing-futures",
  },
  {
    name: "Fairways For Recovery",
    slug: "fairways-for-recovery",
    category: "Mental Health",
    region: "Ireland",
    description:
      "Pairing outdoor golf-based therapy days with licensed support for adults recovering from burnout and trauma.",
    impactMetric: "72 therapy rounds sponsored this season",
    upcomingEvent: "May wellbeing scramble in Dublin",
    featured: true,
    imageUrl: "",
    websiteUrl: "https://birdiefund.local/charities/fairways-for-recovery",
  },
  {
    name: "Green Grants Alliance",
    slug: "green-grants-alliance",
    category: "Club Sustainability",
    region: "Europe",
    description:
      "Supporting water-conscious course upgrades and volunteer-led habitat restoration at grassroots clubs.",
    impactMetric: "14 eco-grants distributed this year",
    upcomingEvent: "June sustainability showcase",
    featured: false,
    imageUrl: "",
    websiteUrl: "https://birdiefund.local/charities/green-grants-alliance",
  },
  {
    name: "Open Doors Caddie Fund",
    slug: "open-doors-caddie-fund",
    category: "Education",
    region: "India",
    description:
      "Backing scholarships, equipment grants, and mentorship for young caddies and hospitality workers building careers beyond the course.",
    impactMetric: "49 scholarships funded this year",
    upcomingEvent: "July mentorship day in Bengaluru",
    featured: true,
    imageUrl: "",
    websiteUrl: "https://birdiefund.local/charities/open-doors-caddie-fund",
  },
  {
    name: "Accessible Fairways Network",
    slug: "accessible-fairways-network",
    category: "Inclusive Access",
    region: "Global",
    description:
      "Creating adaptive golf sessions, mobility equipment support, and inclusive coaching pathways for players with disabilities.",
    impactMetric: "31 adaptive sessions supported this month",
    upcomingEvent: "August inclusive golf clinic",
    featured: false,
    imageUrl: "",
    websiteUrl: "https://birdiefund.local/charities/accessible-fairways-network",
  },
];

export async function ensureBootstrapData() {
  await connectToDatabase();

  const charityCount = await CharityModel.countDocuments();

  if (charityCount === 0) {
    await CharityModel.insertMany(defaultCharities);
  }
}
