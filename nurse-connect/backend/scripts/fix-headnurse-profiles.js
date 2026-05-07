/**
 * Fix: Recreate missing HeadNurse profile documents for users with role "head_nurse"
 * Saves to the correct "head_nurses" collection.
 * Run: node scripts/fix-headnurse-profiles.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({ email: String, passwordHash: String, role: String, name: String, username: String });
const User = mongoose.model("User", userSchema);

const headNurseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  phone: { type: String, default: null },
  department_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  division_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  ward_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  experience_years: { type: Number, default: 0 },
  photo_url: { type: String, default: null },
}, { collection: "head_nurses" }); // Must match the real collection name!
const HeadNurse = mongoose.model("HeadNurseFixed", headNurseSchema);

const departmentSchema = new mongoose.Schema({ name: String }, { collection: "departments" });
const Department = mongoose.model("Department", departmentSchema);

const wardSchema = new mongoose.Schema({ name: String, department_id: mongoose.Schema.Types.ObjectId }, { collection: "wards" });
const Ward = mongoose.model("Ward", wardSchema);

async function main() {
  const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB\n");

  // Clean up any profiles created in wrong collection (headnurses) from previous run
  const wrongDb = mongoose.connection.db.collection("headnurses");
  const wrongCount = await wrongDb.countDocuments();
  if (wrongCount > 0) {
    await wrongDb.deleteMany({});
    console.log(`🗑  Removed ${wrongCount} incorrectly placed profile(s) from "headnurses" collection.\n`);
  }

  const hnUsers = await User.find({ role: "head_nurse" }).lean();
  const departments = await Department.find({}).lean();
  const wards = await Ward.find({}).lean();

  console.log(`Found ${hnUsers.length} users with role "head_nurse"`);
  console.log(`Found ${departments.length} departments, ${wards.length} wards\n`);

  let created = 0;
  let skipped = 0;

  for (const user of hnUsers) {
    const existing = await HeadNurse.findOne({ user_id: user._id }).lean();
    if (existing) {
      console.log(`  SKIP: ${user.email} already has a HeadNurse profile`);
      skipped++;
      continue;
    }

    // Try to match department from email slug
    let matchedDept = null;
    let matchedWard = null;
    const emailPrefix = user.email.split("@")[0].replace(/^hn_/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const dept of departments) {
      const deptSlug = dept.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (deptSlug === emailPrefix || deptSlug.startsWith(emailPrefix.slice(0, 8)) || emailPrefix.startsWith(deptSlug.slice(0, 8))) {
        matchedDept = dept;
        matchedWard = wards.find(w => String(w.department_id) === String(dept._id)) || null;
        break;
      }
    }

    const username = user.username || user.email.split("@")[0];

    // Check for username uniqueness; add suffix if needed
    let finalUsername = username;
    const usernameExists = await HeadNurse.findOne({ username: finalUsername }).lean();
    if (usernameExists) {
      finalUsername = `${username}_${Date.now()}`;
    }

    const profile = await HeadNurse.create({
      user_id: user._id,
      name: user.name,
      username: finalUsername,
      department_id: matchedDept?._id || null,
      ward_id: matchedWard?._id || null,
    });

    const deptInfo = matchedDept ? `dept: ${matchedDept.name}` : "dept: NOT MATCHED ⚠️";
    const wardInfo = matchedWard ? `ward: ${matchedWard.name}` : "ward: NOT MATCHED ⚠️";
    console.log(`  ✅ CREATED: ${user.email} → ${deptInfo}, ${wardInfo}`);
    created++;
  }

  console.log(`\nSummary: ${created} created, ${skipped} skipped`);

  if (created > 0) {
    console.log("\n✅ HeadNurse profiles are now created in the correct 'head_nurses' collection.");
    console.log("   Head nurses can now log in and generate schedules.");
    console.log("   For profiles with 'NOT MATCHED' department/ward, assign them via the Admin dashboard.");
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
