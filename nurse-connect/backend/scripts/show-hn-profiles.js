/**
 * Debug: Show all HeadNurse profiles with their ward/dept assignments
 * Run: node scripts/show-hn-profiles.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const headNurseSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  name: String,
  username: String,
  department_id: mongoose.Schema.Types.ObjectId,
  ward_id: mongoose.Schema.Types.ObjectId,
}, { collection: "head_nurses" });
const HeadNurse = mongoose.model("HN2", headNurseSchema);

const userSchema = new mongoose.Schema({ email: String, role: String, name: String });
const User = mongoose.model("User2", userSchema);

const departmentSchema = new mongoose.Schema({ name: String }, { collection: "departments" });
const Department = mongoose.model("Dept2", departmentSchema);

const wardSchema = new mongoose.Schema({ name: String, department_id: mongoose.Schema.Types.ObjectId }, { collection: "wards" });
const Ward = mongoose.model("Ward2", wardSchema);

async function main() {
  const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  const profiles = await HeadNurse.find({}).lean();
  const users = await User.find({ role: "head_nurse" }).lean();
  const depts = await Department.find({}).lean();
  const wards = await Ward.find({}).lean();

  const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
  const deptMap = Object.fromEntries(depts.map(d => [d._id.toString(), d.name]));
  const wardMap = Object.fromEntries(wards.map(w => [w._id.toString(), w]));

  console.log(`\nHeadNurse Profiles in "head_nurses" collection: ${profiles.length}\n`);
  console.log("email".padEnd(45), "dept".padEnd(35), "ward");
  console.log("-".repeat(110));

  for (const hn of profiles) {
    const user = hn.user_id ? userMap[hn.user_id.toString()] : null;
    const email = user?.email || `[no user] ${hn.name}`;
    const dept = hn.department_id ? (deptMap[hn.department_id.toString()] || `(unknown ${hn.department_id})`) : "❌ NO DEPT";
    const ward = hn.ward_id ? (wardMap[hn.ward_id.toString()]?.name || `(unknown ${hn.ward_id})`) : "❌ NO WARD";
    const wardStatus = hn.ward_id ? "" : " ← CAUSES 403!";
    console.log(email.padEnd(45), dept.padEnd(35), ward + wardStatus);
  }

  console.log("\nNote: Head nurses with NO WARD will get 403 when generating schedules.");
  await mongoose.disconnect();
}

main().catch(console.error);
