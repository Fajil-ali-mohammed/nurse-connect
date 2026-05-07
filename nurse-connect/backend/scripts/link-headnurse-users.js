/**
 * Fix: Link HeadNurse profiles to their User accounts by matching names/email patterns
 * Run: node scripts/link-headnurse-users.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const headNurseSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: String,
  username: String,
  department_id: mongoose.Schema.Types.ObjectId,
  ward_id: mongoose.Schema.Types.ObjectId,
}, { collection: "head_nurses" });
const HeadNurse = mongoose.model("HNLink", headNurseSchema);

const userSchema = new mongoose.Schema({ email: String, role: String, name: String, username: String });
const User = mongoose.model("UserLink", userSchema);

const departmentSchema = new mongoose.Schema({ name: String }, { collection: "departments" });
const Department = mongoose.model("DeptLink", departmentSchema);

function slugify(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function main() {
  const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB\n");

  const hnUsers = await User.find({ role: "head_nurse" }).lean();
  const profiles = await HeadNurse.find({}).lean();
  const departments = await Department.find({}).lean();
  const deptMap = Object.fromEntries(departments.map(d => [d._id.toString(), d]));

  console.log(`Head nurse users: ${hnUsers.length}`);
  console.log(`Head nurse profiles: ${profiles.length}\n`);

  let linked = 0;
  let alreadyLinked = 0;

  for (const profile of profiles) {
    // Already linked correctly?
    if (profile.user_id) {
      const matchingUser = hnUsers.find(u => u._id.toString() === profile.user_id.toString());
      if (matchingUser) {
        console.log(`  ALREADY LINKED: "${profile.name}" → ${matchingUser.email}`);
        alreadyLinked++;
        continue;
      }
    }

    // Try to find a matching user by name
    let matchedUser = null;

    // Strategy 1: Match by profile name to user name
    matchedUser = hnUsers.find(u => slugify(u.name) === slugify(profile.name));

    // Strategy 2: Match by department
    if (!matchedUser && profile.department_id) {
      const dept = deptMap[profile.department_id.toString()];
      if (dept) {
        const deptSlug = slugify(dept.name);
        // Find a hn user whose email contains the dept slug
        matchedUser = hnUsers.find(u => {
          const emailSlug = slugify(u.email.split("@")[0].replace(/^hn_/, ""));
          return emailSlug === deptSlug || deptSlug.startsWith(emailSlug.slice(0, 8)) || emailSlug.startsWith(deptSlug.slice(0, 8));
        });
        // Avoid linking an already-claimed user
        if (matchedUser) {
          const alreadyUsed = await HeadNurse.findOne({ user_id: matchedUser._id }).lean();
          if (alreadyUsed && alreadyUsed._id.toString() !== profile._id.toString()) {
            console.log(`  CONFLICT: "${profile.name}" matched ${matchedUser.email} but that user is already linked to another profile`);
            matchedUser = null;
          }
        }
      }
    }

    if (matchedUser) {
      await HeadNurse.findByIdAndUpdate(profile._id, { $set: { user_id: matchedUser._id } });
      console.log(`  ✅ LINKED: "${profile.name}" → ${matchedUser.email}`);
      linked++;
    } else {
      console.log(`  ⚠️  NO MATCH: "${profile.name}" (dept: ${profile.department_id ? deptMap[profile.department_id.toString()]?.name : "none"})`);
    }
  }

  console.log(`\nSummary: ${linked} newly linked, ${alreadyLinked} already correct`);

  // Show any HN users still not linked
  const linkedUserIds = new Set((await HeadNurse.find({ user_id: { $ne: null } }).lean()).map(p => p.user_id?.toString()));
  const unlinked = hnUsers.filter(u => !linkedUserIds.has(u._id.toString()));
  if (unlinked.length > 0) {
    console.log(`\n⚠️  These ${unlinked.length} head nurse user(s) have NO matching profile:`);
    for (const u of unlinked) {
      console.log(`   ${u.email} (${u.name})`);
      // Create a fresh profile for them
      console.log(`   → Creating a new profile...`);
      await HeadNurse.create({
        user_id: u._id,
        name: u.name,
        username: u.username || u.email.split("@")[0],
        department_id: null,
        ward_id: null,
      });
      console.log(`   → Created. Assign ward/dept via Admin dashboard.`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone. Head nurses should now be able to generate schedules.");
}

main().catch(console.error);
