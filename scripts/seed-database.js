/**
 * Database Seed Script
 * Adds sample charities after cleanup
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function seedDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected successfully\n");

    const db = mongoose.connection.db;

    const charities = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Make-A-Wish Foundation",
        slug: "make-a-wish",
        category: "Children Health",
        description: "Granting wishes to children with critical illnesses",
        upcomingEvent: "Annual Golf Charity Tournament - April 2026",
        websiteUrl: "https://www.makewish.org",
        impactMetric: "5,000+ wishes granted annually",
        totalDonations: 0,
        supporterCount: 0,
        featured: true,
        createdAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "St. Jude Children's Research Hospital",
        slug: "st-jude",
        category: "Children Health",
        description: "Leading pediatric cancer research and treatment",
        upcomingEvent: "Spring Golf Invitational - May 2026",
        websiteUrl: "https://www.stjude.org",
        impactMetric: "1000+ children treated annually",
        totalDonations: 0,
        supporterCount: 0,
        featured: true,
        createdAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Doctors Without Borders",
        slug: "doctors-without-borders",
        category: "International Health",
        description: "Emergency medical aid and healthcare in crisis zones",
        upcomingEvent: "Global Health Awareness Golf Cup - June 2026",
        websiteUrl: "https://www.msf.org",
        impactMetric: "70+ countries assisted",
        totalDonations: 0,
        supporterCount: 0,
        featured: false,
        createdAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "American Cancer Society",
        slug: "american-cancer-society",
        category: "Cancer Research",
        description: "Preventing cancer and supporting cancer survivors",
        upcomingEvent: "Cancer Research Golf Championship - July 2026",
        websiteUrl: "https://www.cancer.org",
        impactMetric: "$400M+ invested in research",
        totalDonations: 0,
        supporterCount: 0,
        featured: true,
        createdAt: new Date(),
      },
    ];

    console.log("🌱 Seeding sample charities...\n");
    const charityResult = await db.collection("charities").insertMany(charities);
    console.log(`✅ Added ${charityResult.insertedIds.length} charities`);

    charities.forEach((charity) => {
      console.log(`   - ${charity.name}`);
    });

    console.log("\n✅ Database seeding completed successfully!");
    console.log("🎉 Ready for demo!\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

seedDatabase();
