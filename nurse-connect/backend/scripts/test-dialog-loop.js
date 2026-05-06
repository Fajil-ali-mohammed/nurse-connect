/**
 * Simulates EXACTLY what the browser does in the infinite-loop scenario:
 * 1. Auto-Generate (no flags) → expects 400/409
 * 2. If 409: "Overwrite" click → handleGenerate(false, true)
 *    → if that gives 400: "Generate Anyway" (OLD frontend) → handleGenerate(true, false)
 *    This is the EXACT call that was looping. With the backend fix it should now return 200.
 */
import "dotenv/config";

const API_BASE = "http://localhost:4000/api";
const WEEK = 21;
const YEAR = 2026;

async function login() {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "headnurse1@caritas.local", password: "headnurse@123456" }),
  });
  const d = await res.json();
  if (!d.session?.access_token) throw new Error("Login failed");
  return d.session.access_token;
}

async function gen(token, force_assign_remaining, confirm_overwrite) {
  const label = `force=${force_assign_remaining}, overwrite=${confirm_overwrite}`;
  const res = await fetch(`${API_BASE}/functions/generate-schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      week_number: WEEK, year: YEAR,
      force_assign_remaining, confirm_overwrite,
      shift_pattern: "12_hours", max_shifts_per_week: 3,
    }),
  });
  const body = await res.json();
  console.log(`  [${label}] → ${res.status} | code: ${body.code || "OK"} | entries: ${body.stats?.total_entries ?? "-"}`);
  return { status: res.status, body };
}

async function main() {
  const token = await login();
  console.log("✅ Logged in\n");

  console.log("=== SIMULATING BROWSER DIALOG FLOW ===\n");

  // Step 1: User clicks "Auto-Generate"
  console.log("STEP 1: Auto-Generate (force=false, overwrite=false)");
  let r = await gen(token, false, false);
  
  if (r.status === 409) {
    console.log("  → Overwrite dialog shown\n");

    // Step 2: User clicks "Overwrite"
    console.log("STEP 2: User clicks Overwrite (force=false, overwrite=true)");
    r = await gen(token, false, true);
    
    if (r.status === 400 && r.body.can_force_generate) {
      console.log("  → Fallback dialog shown\n");

      // Step 3a: OLD frontend behavior (no confirmOverwrite carried)
      console.log("STEP 3a: OLD 'Generate Anyway' (force=true, overwrite=false)  ← was the loop");
      r = await gen(token, true, false);
      if (r.status === 200) console.log("  ✅ FIXED! Backend now handles this correctly.");
      else console.log("  ❌ STILL BROKEN:", r.body.code || r.body.error);
    } else if (r.status === 200) {
      console.log("  ✅ Generated directly (no fallback needed):", r.body.stats);
    }
  } else if (r.status === 400 && r.body.can_force_generate) {
    console.log("  → Fallback dialog shown (no existing schedule)\n");

    // Step 2: User clicks "Generate Anyway"
    console.log("STEP 2: 'Generate Anyway' (force=true, overwrite=false)");
    r = await gen(token, true, false);
    if (r.status === 200) console.log("  ✅ SUCCESS:", r.body.stats);
    else console.log("  ❌ FAILED:", r.body);
  } else if (r.status === 200) {
    console.log("  ✅ Generated directly:", r.body.stats);
  }

  console.log("\n=== NEW FLOW TEST (clean state) ===\n");

  // Reset: delete the schedule
  console.log("STEP 4: Overwrite again to confirm repeat works");
  r = await gen(token, false, true);
  console.log(`  Status: ${r.status}`);

  console.log("\nSTEP 5: Force on top of existing");
  r = await gen(token, true, false);
  if (r.status === 200) console.log("  ✅ force=true always overwrites:", r.body.stats);
  else console.log("  ❌", r.body.code, r.body.error);
}

main().catch(console.error);
