import "express-async-errors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./config/db";
import { User } from "./models/user.model";
import { Tag } from "./models/tag.model";
import { FinancialRecord } from "./models/record.model";
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
const CATEGORIES = ["Food", "Salary", "Rent", "Transport", "Entertainment"];

const TAG_DEFS = [
  { name: "food", color: "#f97316" },
  { name: "transport", color: "#3b82f6" },
  { name: "salary", color: "#22c55e" },
  { name: "rent", color: "#ef4444" },
  { name: "entertainment", color: "#a855f7" },
];

const USER_DEFS = [
  {
    name: "Admin User",
    email: "admin@finance.com",
    password: "Admin@1234",
    role: "admin" as const,
  },
  {
    name: "Analyst",
    email: "analyst@finance.com",
    password: "Analyst@1234",
    role: "analyst" as const,
  },
  {
    name: "Viewer",
    email: "viewer@finance.com",
    password: "Viewer@1234",
    role: "viewer" as const,
  },
  {
    name: "test Viewer",
    email: "viewer2@finance.com",
    password: "Viewer@1234",
    role: "viewer" as const,
  },
  {
    name: "Viewer to Analyst",
    email: "viewertoanalyst@finance.com",
    password: "Viewer@1234",
    role: "viewer" as const,
  },
];

function randomBetween(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickRandomTwo<T>(arr: T[]): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

async function seed(): Promise<void> {
  await connectDB();
  console.log("🌱 Starting seed...");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Tag.deleteMany({}),
    FinancialRecord.deleteMany({}).setOptions({ includeDeleted: true }),
  ]);
  console.log("✓ Cleared existing data");

  // Create users
  const hashedUsers = await Promise.all(
    USER_DEFS.map(async (userDef) => ({
      ...userDef,
      password: await bcrypt.hash(userDef.password, 12),
    }))
  );
  const users = await User.insertMany(hashedUsers);
  console.log(`✓ Created ${users.length} users`);

  // Create tags (need a createdBy — use admin)
  const adminUser = users[0]!;
  const tagDocs = await Tag.insertMany(
    TAG_DEFS.map((t) => ({ ...t, createdBy: adminUser._id }))
  );
  console.log(`✓ Created ${tagDocs.length} tags`);

  // Create 100 financial records across last 6 months
  const records = [];

  const incomeCategories = ["Salary", "Entertainment"];
  const expenseCategories = ["Food", "Rent", "Transport", "Entertainment"];

  for (let i = 0; i < 100; i++) {
    const user = pickRandom(users);
    const type: "income" | "expense" = i % 4 === 0 ? "income" : "expense";
    const category =
      type === "income"
        ? pickRandom(incomeCategories)
        : pickRandom(expenseCategories);
    const amount = randomBetween(10, 5000);
    const daysBack = Math.floor(Math.random() * 180); // spread over 6 months
    const tags = pickRandomTwo(tagDocs).map((t) => t._id);

    records.push({
      userId: user._id,
      amount,
      type,
      category,
      date: daysAgo(daysBack),
      tags,
      notes: `${type === "income" ? "Received" : "Paid"} for ${category.toLowerCase()} — record #${i + 1}`,
      isDeleted: false,
    });
  }

  const inserted = await FinancialRecord.insertMany(records);
  console.log(`✓ Created ${inserted.length} financial records`);

  console.log("\n📊 Seed Summary:");
  console.log(`   Users:   ${users.length}`);
  console.log(`   Tags:    ${tagDocs.length}`);
  console.log(`   Records: ${inserted.length}`);

  console.log("\n🔑 Login Credentials:");
  for (const u of USER_DEFS) {
    console.log(`   [${u.role.padEnd(8)}] ${u.email} / ${u.password}`);
  }

  await mongoose.disconnect();
  console.log("\n✅ Seed complete. MongoDB disconnected.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
