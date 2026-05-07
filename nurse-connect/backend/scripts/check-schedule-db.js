import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI_DIRECT || process.env.MONGODB_URI;
await mongoose.connect(uri);

const Schedule = mongoose.connection.db.collection("schedules");
const now = new Date();
const isoWeek = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
};
const currentWeek = isoWeek(now);
const currentYear = now.getFullYear();

// Check last 2 weeks + next 2 weeks for any schedules
for (let wk = currentWeek - 1; wk <= currentWeek + 2; wk++) {
  const count = await Schedule.countDocuments({ week_number: wk, year: currentYear });
  if (count > 0) {
    const sample = await Schedule.findOne({ week_number: wk, year: currentYear });
    console.log(`Week ${wk}/${currentYear}: ${count} entries | ward_id: ${sample.ward_id} | dept: ${sample.department_id}`);
  } else {
    console.log(`Week ${wk}/${currentYear}: 0 entries`);
  }
}

// Also check what ward the nurses in DB belong to
const Nurse = mongoose.connection.db.collection("nurses");
const nurses = await Nurse.find({ is_active: true }).toArray();
console.log(`\nActive nurses: ${nurses.length}`);
nurses.forEach(n => console.log(`  ${n.name} | ward: ${n.current_ward_id} | dept: ${n.current_department_id}`));

await mongoose.disconnect();
