require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Admin = require('../models/Admin');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Grade = require('../models/Grade');
const Settings = require('../models/Settings');
const defaultTemplate = require('../templates/defaultTemplate');

async function seed() {
  await connectDB();

  const admins = [
    { name: 'Super Admin', email: 'admin@mindq.example', password: 'Admin@123', role: 'superadmin' },
    { name: 'Management User', email: 'management@mindq.example', password: 'Manage@123', role: 'management' },
  ];
  for (const a of admins) {
    const exists = await Admin.findOne({ email: a.email });
    if (!exists) await Admin.create(a);
  }

  const courses = [
    { name: 'Full Stack Java Development', code: 'FSJD', durationWeeks: 16 },
    { name: 'Python & Data Science', code: 'PYDS', durationWeeks: 20 },
    { name: 'Digital Marketing', code: 'DGMK', durationWeeks: 8 },
    { name: 'MERN Stack Development', code: 'MERN', durationWeeks: 16 },
  ];
  for (const c of courses) {
    await Course.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  const faculties = [
    { name: 'Ravi Kumar', email: 'ravi.kumar@mindq.example', specialization: 'Java / Spring Boot' },
    { name: 'Sunitha Rao', email: 'sunitha.rao@mindq.example', specialization: 'Python / Data Science' },
    { name: 'Anil Prasad', email: 'anil.prasad@mindq.example', specialization: 'Digital Marketing' },
    { name: 'Priya Menon', email: 'priya.menon@mindq.example', specialization: 'MERN Stack' },
  ];
  for (const f of faculties) {
    await Faculty.findOneAndUpdate({ name: f.name }, f, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  const grades = [
    { label: 'Excellent', minPercentage: 90 },
    { label: 'Very Good', minPercentage: 75 },
    { label: 'Good', minPercentage: 60 },
    { label: 'Average', minPercentage: 40 },
    { label: 'Below Average', minPercentage: 0 },
  ];
  for (const g of grades) {
    await Grade.findOneAndUpdate({ label: g.label }, g, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  await Settings.findOneAndUpdate(
    { key: 'certificateNumbering' },
    { key: 'certificateNumbering', value: { prefix: process.env.CERTIFICATE_PREFIX || 'MQHYD', padLength: Number(process.env.CERTIFICATE_PAD_LENGTH || 6) } },
    { upsert: true }
  );
  await Settings.findOneAndUpdate(
    { key: 'certificateCounter' },
    { $setOnInsert: { key: 'certificateCounter', value: { sequence: 0 } } },
    { upsert: true }
  );
  await Settings.findOneAndUpdate(
    { key: 'studentCounter' },
    { $setOnInsert: { key: 'studentCounter', value: { sequence: 0 } } },
    { upsert: true }
  );
  await Settings.findOneAndUpdate(
    { key: 'certificateTemplate' },
    { $setOnInsert: { key: 'certificateTemplate', value: defaultTemplate } },
    { upsert: true }
  );

  console.log('Seed complete.');
  console.log('  Super Admin login:  admin@mindq.example / Admin@123');
  console.log('  Management login:   management@mindq.example / Manage@123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
