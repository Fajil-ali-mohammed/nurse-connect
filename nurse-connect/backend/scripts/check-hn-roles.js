/**
 * Diagnostic: Check head nurse user roles
 * Run: node scripts/check-hn-roles.js
 */
import "dotenv/config";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: String,
  passwordHash: String,
  role: String,
  name: String,
});
const User = mongoose.model("User", userSchema);

const headNurseSchema = new mongoose.Schema({
  user_id: mongoose.Schema.Types.ObjectId,
  name: String,
  ward_id: mongoose.Schema.Types.ObjectId,
  department_id: mongoose.Schema.Types.ObjectId,
});
const HeadNurse = mongoose.model("HeadNurse", headNurseSchema);

async function main() {
  const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB\n");

  const headNurses = await HeadNurse.find({}).lean();
  console.log(`Found ${headNurses.length} head_nurse profile(s):\n`);

  for (const hn of headNurses) {
    if (!hn.user_id) {
      console.log(`  HeadNurse "${hn.name}" — NO linked user_id`);
      continue;
    }
    const user = await User.findById(hn.user_id).lean();
    if (!user) {
      console.log(`  HeadNurse "${hn.name}" — user_id ${hn.user_id} NOT FOUND in users collection`);
      continue;
    }
    const status = user.role === "head_nurse" ? "✅ OK" : `❌ WRONG ROLE: "${user.role}"`;
    console.log(`  HeadNurse "${hn.name}" / email: ${user.email} — role: "${user.role}" ${status}`);

    if (user.role !== "head_nurse") {
      console.log(`    → Fixing role to "head_nurse"...`);
      await User.findByIdAndUpdate(hn.user_id, { $set: { role: "head_nurse" } });
      console.log(`    → Fixed! User ${user.email} role is now "head_nurse".`);
      console.log(`    → ⚠️  The user must log out and log back in to get a new JWT token with the correct role.`);
    }
  }

  // Also check: any user with role head_nurse but no HeadNurse profile
  const hnUsers = await User.find({ role: "head_nurse" }).lean();
  for (const u of hnUsers) {
    const profile = await HeadNurse.findOne({ user_id: u._id }).lean();
    if (!profile) {
      console.log(`\n⚠️  User "${u.email}" has role "head_nurse" but has NO HeadNurse profile document!`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
