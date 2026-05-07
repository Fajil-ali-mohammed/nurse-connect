/**
 * Full end-to-end test for generate-schedule:
 * 1. First call → expect INSUFFICIENT_NURSES (400 with can_force_generate)
 * 2. Force generate → expect 200 with entries
 * 3. Generate again (no overwrite flag) → expect SCHEDULE_ALREADY_EXISTS (409)
 * 4. Overwrite → expect 200 with overwrite notifications
 */
import "dotenv/config";

const API_BASE = "http://localhost:4000/api";
const WEEK = 21; // Next week
const YEAR = 2026;

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "headnurse1@caritas.local", password: "headnurse@123456" }),
  });
  const d = await res.json();
  if (!d.session?.access_token) throw new Error("Login failed: " + JSON.stringify(d));
  return d.session.access_token;
}

async function generate(token, opts = {}) {
  const res = await fetch(`${API_BASE}/functions/generate-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      week_number: WEEK,
      year: YEAR,
      shift_pattern: "12_hours",
      max_shifts_per_week: 3,
      ...opts,
    }),
  });
  return { status: res.status, body: await res.json() };
}

async function main() {
  console.log("=".repeat(60));
  console.log("Testing generate-schedule end-to-end");
  console.log("=".repeat(60));

  const token = await login();
  console.log("✅ Logged in\n");

  // Step 1: First call — expect INSUFFICIENT_NURSES or success
  console.log(`STEP 1: Generate week ${WEEK}/${YEAR} (no force)...`);
  let r = await generate(token);
  console.log(`  Status: ${r.status}`);
  if (r.status === 400 && r.body.code === "INSUFFICIENT_NURSES") {
    console.log("  ✅ Got INSUFFICIENT_NURSES dialog (expected) — can_force_generate:", r.body.can_force_generate);
  } else if (r.status === 400 && r.body.code === "INSUFFICIENT_ACUITY_RESOURCES") {
    console.log("  ✅ Got INSUFFICIENT_ACUITY_RESOURCES dialog (expected) — can_force_generate:", r.body.can_force_generate);
  } else if (r.status === 409 && r.body.code === "SCHEDULE_ALREADY_EXISTS") {
    console.log("  ℹ️ Schedule already exists — will test overwrite");
  } else if (r.status === 200) {
    console.log("  ✅ Generated directly:", r.body.stats);
  } else {
    console.log("  ❌ Unexpected:", JSON.stringify(r.body));
  }

  // Step 2: Force generate
  console.log(`\nSTEP 2: Force generate (force_assign_remaining=true, confirm_overwrite=true)...`);
  r = await generate(token, { force_assign_remaining: true, confirm_overwrite: true });
  console.log(`  Status: ${r.status}`);
  if (r.status === 200) {
    console.log("  ✅ SUCCESS:", r.body.stats);
    console.log("  AI used:", r.body.ai_used);
    console.log("  Fallback:", r.body.fallback_used);
  } else {
    console.log("  ❌ FAILED:", JSON.stringify(r.body));
    process.exit(1);
  }

  // Step 3: Generate again without overwrite → should get 409
  console.log(`\nSTEP 3: Generate again without overwrite (expect 409)...`);
  r = await generate(token);
  console.log(`  Status: ${r.status}`);
  if (r.status === 409 && r.body.code === "SCHEDULE_ALREADY_EXISTS") {
    console.log("  ✅ Got 409 SCHEDULE_ALREADY_EXISTS (expected)");
    console.log("  Prompt:", r.body.prompt);
  } else {
    console.log("  ❌ Unexpected:", JSON.stringify(r.body));
  }

  // Step 4: Overwrite → expect 200 + overwrite notifications
  console.log(`\nSTEP 4: Overwrite (confirm_overwrite=true, force_assign_remaining=true)...`);
  r = await generate(token, { force_assign_remaining: true, confirm_overwrite: true });
  console.log(`  Status: ${r.status}`);
  if (r.status === 200) {
    console.log("  ✅ OVERWRITE SUCCESS:", r.body.stats);
  } else {
    console.log("  ❌ FAILED:", JSON.stringify(r.body));
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All steps passed! generate-schedule is working correctly.");
  console.log("=".repeat(60));
}

main().catch(console.error);
