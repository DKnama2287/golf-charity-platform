/**
 * Add Admin User Script
 * Adds ONE admin user from .env.local credentials
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("❌ Missing environment variables:");
  if (!MONGODB_URI) console.error("   - MONGODB_URI");
  if (!ADMIN_EMAIL) console.error("   - ADMIN_EMAIL");
  if (!ADMIN_PASSWORD) console.error("   - ADMIN_PASSWORD");
  process.exit(1);
}

async function addAdmin() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected successfully\n");

    const db = mongoose.connection.db;

    console.log("🔐 Creating admin user...\n");

    // Check if admin already exists
    const existingAdmin = await db.collection("users").findOne({ 
      email: ADMIN_EMAIL,
      role: "admin"
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists!");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}\n`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create the admin user
    const adminUser = {
      name: "Administrator",
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
      subscription: {
        plan: "yearly",
        status: "active",
        monthlyPrice: 19,
        yearlyPrice: 149,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      charityId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(adminUser);

    console.log("✅ Admin User Created Successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`👤 Name:     Administrator`);
    console.log(`📧 Email:    ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`👨‍💼 Role:     admin`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🌐 Access Admin Panel:");
    console.log("   URL: http://localhost:3000/admin");
    console.log("   Email: " + ADMIN_EMAIL);
    console.log("   Password: " + ADMIN_PASSWORD + "\n");

    // Verify the admin was created
    const verifyAdmin = await db.collection("users").countDocuments({ 
      role: "admin" 
    });
    console.log(`✅ Total admin users in database: ${verifyAdmin}\n`);

    console.log("🎉 Admin user added successfully!");
    console.log("💡 You can now login to the admin panel\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

addAdmin();
