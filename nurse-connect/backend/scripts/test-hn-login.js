/**
 * Debug: Test a head nurse login and generate-schedule call end-to-end
 * Run: node scripts/test-hn-login.js <email> <password>
 */
import "dotenv/config";

const API_BASE = "http://localhost:4000/api";
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log("Usage: node scripts/test-hn-login.js <email> <password>");
  process.exit(1);
}

async function main() {
  console.log(`\n1️⃣  Logging in as ${email}...`);
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  
  if (!loginRes.ok) {
    console.error("❌ Login failed:", loginData.error);
    process.exit(1);
  }
  
  const token = loginData.session?.access_token;
  console.log(`✅ Logged in! Role: ${loginData.role}`);
  console.log(`   Token: ${token?.slice(0, 40)}...`);

  console.log(`\n2️⃣  Calling /auth/me to verify role...`);
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await meRes.json();
  console.log(`   Status: ${meRes.status}`);
  console.log(`   Role: ${meData.role}`);

  console.log(`\n3️⃣  Calling /functions/generate-schedule...`);
  const genRes = await fetch(`${API_BASE}/functions/generate-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      week_number: 20,
      year: 2026,
      shift_pattern: "12_hours",
      max_shifts_per_week: 3,
    }),
  });
  const genData = await genRes.json();
  console.log(`   Status: ${genRes.status}`);
  console.log(`   Response:`, JSON.stringify(genData, null, 2));
}

main().catch(console.error);
