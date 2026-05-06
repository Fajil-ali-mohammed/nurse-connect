/**
 * Test: force generate schedule for headnurse1
 */
import "dotenv/config";

const API_BASE = "http://localhost:4000/api";

async function main() {
  // Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "headnurse1@caritas.local", password: "headnurse@123456" }),
  });
  const loginData = await loginRes.json();
  const token = loginData.session?.access_token;
  if (!token) { console.error("Login failed:", loginData); process.exit(1); }
  console.log("✅ Logged in as headnurse1");

  // Force generate schedule
  console.log("\n🔄 Calling generate-schedule with force_assign_remaining=true...");
  const res = await fetch(`${API_BASE}/functions/generate-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      week_number: 20,
      year: 2026,
      force_assign_remaining: true,
      shift_pattern: "12_hours",
      max_shifts_per_week: 3,
      confirm_overwrite: true,
    }),
  });
  const result = await res.json();
  console.log(`Status: ${res.status}`);
  if (res.ok) {
    console.log(`\n✅ SUCCESS! Generated schedule:`);
    console.log(`   Total entries: ${result.stats?.total_entries}`);
    console.log(`   Nurses scheduled: ${result.stats?.nurses_scheduled}`);
    console.log(`   AI used: ${result.ai_used}`);
    console.log(`   Fallback used: ${result.fallback_used}`);
  } else {
    console.log(`\n❌ FAILED:`, JSON.stringify(result, null, 2));
  }
}

main().catch(console.error);
