/**
 * Full diagnostic: all head nurses, their wards, and nurse counts
 */
import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
await mongoose.connect(uri);
const db = mongoose.connection.db;

const users       = db.collection("users");
const headNurses  = db.collection("head_nurses");
const wards       = db.collection("wards");
const departments = db.collection("departments");
const nurses      = db.collection("nurses");
const schedules   = db.collection("schedules");

const allHN = await headNurses.find({}).toArray();
console.log(`\nTotal head nurse profiles: ${allHN.length}\n`);
console.log("=".repeat(90));

let okCount = 0, missingWard = 0, missingNurses = 0;

for (const hn of allHN) {
  const user = hn.user_id ? await users.findOne({ _id: hn.user_id }) : null;
  const ward = hn.ward_id ? await wards.findOne({ _id: hn.ward_id }) : null;
  const dept = ward?.department_id
    ? await departments.findOne({ _id: ward.department_id })
    : hn.department_id
    ? await departments.findOne({ _id: hn.department_id })
    : null;
  const nurseCount = hn.ward_id
    ? await nurses.countDocuments({ current_ward_id: hn.ward_id, is_active: true })
    : 0;
  
  // Check if they have any schedules (any week)
  const schedCount = hn.ward_id
    ? await schedules.countDocuments({ ward_id: hn.ward_id })
    : 0;

  const status = !hn.ward_id ? "❌ NO WARD" : nurseCount === 0 ? "⚠️  NO NURSES" : "✅ OK";
  if (!hn.ward_id) missingWard++;
  else if (nurseCount === 0) missingNurses++;
  else okCount++;

  console.log(`${status}  ${(user?.email || hn.name || "?").padEnd(38)} ward: ${ward?.name || "null"} | dept: ${dept?.name || "null"} | nurses: ${nurseCount} | schedules: ${schedCount}`);
}

console.log("=".repeat(90));
console.log(`\nSummary: ✅ ${okCount} ready | ❌ ${missingWard} missing ward | ⚠️  ${missingNurses} no nurses in ward`);
console.log("\nWards with active nurses:");
const wardsWithNurses = await nurses.aggregate([
  { $match: { is_active: true, current_ward_id: { $ne: null } } },
  { $group: { _id: "$current_ward_id", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]).toArray();
for (const w of wardsWithNurses) {
  const ward = await wards.findOne({ _id: w._id });
  const dept = ward?.department_id ? await departments.findOne({ _id: ward.department_id }) : null;
  console.log(`  Ward: ${ward?.name || w._id} | Dept: ${dept?.name || "?"} | Nurses: ${w.count}`);
}

await mongoose.disconnect();
