// DEV-ONLY convenience script — NOT part of the shipped app. Boots an
// in-memory MongoDB and seeds it, so the real server (server.js / app.js)
// can be exercised in a browser without requiring MongoDB to be installed
// first. Production/real usage should run `npm start` against a real
// MONGO_URI in .env (see .env.example and docs/DEPLOYMENT.md).
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_only_secret_do_not_use_in_production';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
process.env.JWT_REMEMBER_EXPIRES_IN = process.env.JWT_REMEMBER_EXPIRES_IN || '30d';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
process.env.CERTIFICATE_PREFIX = process.env.CERTIFICATE_PREFIX || 'MQHYD';
process.env.CERTIFICATE_PAD_LENGTH = process.env.CERTIFICATE_PAD_LENGTH || '6';

const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri('mindq_certificates');

  const mongoose = require('mongoose');
  const connectDB = require('../src/config/db');
  await connectDB();

  const Admin = require('../src/models/Admin');
  const Course = require('../src/models/Course');
  const Faculty = require('../src/models/Faculty');
  const Grade = require('../src/models/Grade');
  const Settings = require('../src/models/Settings');
  const defaultTemplate = require('../src/templates/defaultTemplate');

  await Admin.create([
    { name: 'Super Admin', email: 'admin@mindq', password: 'mindq@admin', role: 'superadmin' },
    { name: 'Management User', email: 'management@mindq', password: 'mindq@management', role: 'management' },
  ]);

  await Course.create([
    { name: 'Full Stack Java Development', code: 'FSJD', durationWeeks: 16 },
    { name: 'Python & Data Science', code: 'PYDS', durationWeeks: 20 },
    { name: 'Digital Marketing', code: 'DGMK', durationWeeks: 8 },
    { name: 'MERN Stack Development', code: 'MERN', durationWeeks: 16 },
  ]);

  await Faculty.create([
    { name: 'Ravi Kumar', email: 'ravi.kumar@mindq.example', specialization: 'Java / Spring Boot' },
    { name: 'Sunitha Rao', email: 'sunitha.rao@mindq.example', specialization: 'Python / Data Science' },
    { name: 'Anil Prasad', email: 'anil.prasad@mindq.example', specialization: 'Digital Marketing' },
    { name: 'Priya Menon', email: 'priya.menon@mindq.example', specialization: 'MERN Stack' },
  ]);

  await Grade.create([
    { label: 'Excellent', minPercentage: 90 },
    { label: 'Very Good', minPercentage: 75 },
    { label: 'Good', minPercentage: 60 },
    { label: 'Average', minPercentage: 40 },
    { label: 'Below Average', minPercentage: 0 },
  ]);

  await Settings.create({ key: 'certificateNumbering', value: { prefix: 'MQHYD', padLength: 6 } });
  await Settings.create({ key: 'certificateCounter', value: { sequence: 0 } });
  await Settings.create({ key: 'studentCounter', value: { sequence: 0 } });
  await Settings.create({ key: 'certificateTemplate', value: defaultTemplate });

  console.log('In-memory MongoDB seeded. Super Admin: admin@mindq / mindq@admin');
  console.log('Management: management@mindq / mindq@management');

  const app = require('../src/app');
  app.listen(process.env.PORT, () => {
    console.log(`Dev API (in-memory DB) listening on http://localhost:${process.env.PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start dev server with in-memory DB:', err);
  process.exit(1);
});
