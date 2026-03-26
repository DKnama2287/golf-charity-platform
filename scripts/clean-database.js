/**
 * Database Cleanup Script
 * Removes all user data and statistics to start fresh
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

async function cleanDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected successfully\n");

    const db = mongoose.connection.db;
    console.log("📊 STEP 1: Removing all user data and statistics...\n");

    const collectionsToClean = [
      "users",
      "scores",
      "winnings",
      "winnerverifications",
      "donations",
      "draws",
    ];

    let totalDeletedDocuments = 0;

    for (const collection of collectionsToClean) {
      try {
        const result = await db.collection(collection).deleteMany({});
        totalDeletedDocuments += result.deletedCount;
        console.log(`✅ ${collection.padEnd(20)} → Deleted ${result.deletedCount} documents`);
      } catch (error) {
        console.log(`⚠️  ${collection.padEnd(20)} → Collection doesn't exist`);
      }
    }

    console.log("\n📊 STEP 2: Resetting charity statistics...\n");

    try {
      const charityUpdateResult = await db.collection("charities").updateMany(
        {},
        {
          $set: {
            totalDonations: 0,
            supporterCount: 0,
          },
        }
      );
      if (charityUpdateResult.modifiedCount > 0) {
        console.log(`✅ Reset charity statistics: ${charityUpdateResult.modifiedCount} charities updated`);
      }
    } catch (error) {
      console.log("⚠️  Could not update charity statistics");
    }

    console.log("\n📋 Verification:\n");
    const adminCount = await db.collection("users").countDocuments({ role: "admin" });
    const charityCount = await db.collection("charities").countDocuments({});
    const scoreCount = await db.collection("scores").countDocuments({});
    const winningsCount = await db.collection("winnings").countDocuments({});
    const drawsCount = await db.collection("draws").countDocuments({});

    console.log("✅ Admin users:        " + adminCount);
    console.log("✅ Charities:          " + charityCount);
    console.log("❌ Scores:             " + (scoreCount === 0 ? "CLEARED" : scoreCount));
    console.log("❌ Winnings:           " + (winningsCount === 0 ? "CLEARED" : winningsCount));
    console.log("❌ Draws:              " + (drawsCount === 0 ? "CLEARED" : drawsCount));

    console.log("\n✨ Database cleanup completed successfully!");
    console.log("🎉 All user statistics removed!\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

cleanDatabase();
