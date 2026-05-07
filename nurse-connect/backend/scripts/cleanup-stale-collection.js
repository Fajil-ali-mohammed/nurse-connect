/**
 * Cleanup: Remove the incorrectly named "headnurses" collection (wrong collection from earlier buggy script)
 */
import "dotenv/config";
import mongoose from "mongoose";

async function main() {
  const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  
  const col = db.collection("headnurses");
  const count = await col.countDocuments();
  if (count > 0) {
    await col.deleteMany({});
    console.log(`Removed ${count} documents from stale "headnurses" collection.`);
  } else {
    console.log('"headnurses" collection is already empty or does not exist.');
  }
  
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(console.error);
