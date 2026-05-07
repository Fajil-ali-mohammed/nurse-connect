/**
 * Raw DB inspection - show all collections and user roles
 */
import "dotenv/config";
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;

  const collections = await db.listCollections().toArray();
  console.log("\nCollections in DB:", collections.map(c => c.name));

  // Check users collection
  const usersCol = db.collection("users");
  const allUsers = await usersCol.find({}).project({ email: 1, role: 1, name: 1 }).toArray();
  console.log(`\nTotal users: ${allUsers.length}`);

  const roles = {};
  for (const u of allUsers) {
    roles[u.role] = (roles[u.role] || 0) + 1;
  }
  console.log("Role breakdown:", roles);

  const hnUsers = allUsers.filter(u => u.role === "head_nurse");
  console.log("\nHead nurse users:");
  for (const u of hnUsers) {
    console.log(`  ${u.email} | ${u.name} | id: ${u._id}`);
  }

  // Check head_nurses collection
  const hnCol = db.collection("head_nurses");
  const hnProfiles = await hnCol.find({}).project({ user_id: 1, name: 1, department_id: 1, ward_id: 1 }).toArray();
  console.log(`\nhead_nurses collection: ${hnProfiles.length} documents`);
  for (const hn of hnProfiles) {
    console.log(`  name: ${hn.name} | user_id: ${hn.user_id} | ward_id: ${hn.ward_id}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
