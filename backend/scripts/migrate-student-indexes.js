// One-off migration: the Student model used to enforce email/phone as
// globally unique; it now allows the same person to enroll in more than one
// course, enforced instead by compound {email,course} / {phone,course}
// unique indexes (see models/Student.js). Mongoose's autoIndex only ADDS
// missing indexes on boot — it never drops ones no longer in the schema — so
// the old email_1 / phone_1 unique indexes have to be dropped by hand or
// they'd keep rejecting a second course for the same student.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Student = require('../src/models/Student');

async function migrate() {
  await connectDB();
  const collection = Student.collection;

  const existing = await collection.indexes();
  console.log('Existing indexes:', existing.map((i) => i.name));

  for (const name of ['email_1', 'phone_1']) {
    if (existing.some((i) => i.name === name)) {
      await collection.dropIndex(name);
      console.log(`Dropped ${name}`);
    } else {
      console.log(`${name} not present, skipping`);
    }
  }

  await Student.syncIndexes();
  const after = await collection.indexes();
  console.log('Indexes after migration:', after.map((i) => `${i.name} (unique=${!!i.unique})`));

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
