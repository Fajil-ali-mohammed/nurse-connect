/**
 * Bulk test: verify every head nurse can generate/view their schedule
 */
import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection.db;

const API = "http://localhost:4000/api";
const WEEK = 19;
const YEAR = 2026;

// Fetch all users with head_nurse role
const users = await db.collection("users").find({ role: "head_nurse" }).toArray();
const headNurses = await db.collection("head_nurses").find({}).toArray();

let passed = 0, failed = 0, skipped = 0;

for (const hn of headNurses) {
  const user = users.find(u => String(u._id) === String(hn.user_id));
  if (!user?.email) { console.log(`  ⏭  ${hn.name} — no user account`); skipped++; continue; }
  if (!hn.ward_id) { console.log(`  ❌ ${user.email} — no ward assigned`); skipped++; continue; }

  // Login
  const loginRes = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: "headnurse@123456" }),
  });
  const loginData = await loginRes.json();
  if (!loginData.session?.access_token) {
    console.log(`  ❌ ${user.email} — login failed: ${loginData.error || "unknown"}`);
    failed++;
    continue;
  }
  const token = loginData.session.access_token;

  // Test generate (force=true to bypass insufficient nurses)
  const genRes = await fetch(`${API}/functions/generate-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      week_number: WEEK, year: YEAR,
      force_assign_remaining: true, confirm_overwrite: false,
      shift_pattern: "12_hours", max_shifts_per_week: 3,
    }),
  });
  const genData = await genRes.json();

  if (genRes.status === 200) {
    console.log(`  ✅ ${user.email.padEnd(48)} → ${genData.stats?.total_entries ?? 0} entries`);
    passed++;
  } else {
    console.log(`  ❌ ${user.email.padEnd(48)} → ${genRes.status} ${genData.code || genData.error}`);
    failed++;
  }
}

await mongoose.disconnect();
console.log(`\n========================================`);
console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭  Skipped: ${skipped}`);
