// One-time migration: wipes all test/demo data (students, certificates,
// activity log, courses, faculties, grades) and replaces it with the real
// ~20,067-record legacy dataset prepared earlier (migration_clean.json).
// Admin accounts and Settings are left untouched — logins must keep working
// and config (template, numbering prefix) must stay as-is.
//
// Deliberately does NOT import emailService or call any send function —
// this is a pure data load, not a re-run of the submit/approve workflow, and
// must never email 20,000 real people about something that happened years
// ago.
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Admin = require('../src/models/Admin');
const Student = require('../src/models/Student');
const Certificate = require('../src/models/Certificate');
const Course = require('../src/models/Course');
const Faculty = require('../src/models/Faculty');
const Grade = require('../src/models/Grade');
const Settings = require('../src/models/Settings');
const ActivityLog = require('../src/models/ActivityLog');
const defaultTemplate = require('../src/templates/defaultTemplate');

const CLEAN_JSON =
  'C:/Users/mohan/AppData/Local/Temp/claude/C--Users-mohan-OneDrive-Desktop/8fca7c55-4f4d-498b-9e15-9114f99ec072/scratchpad/migration_clean.json';

const GRADE_LABELS = ['Excellent', 'Very Good', 'Good', 'Average', 'Below Average', 'Satisfactory', 'Scope for Improvement'];

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  await connectDB();

  const superAdmin = await Admin.findOne({ role: 'superadmin' });
  if (!superAdmin) throw new Error('No super admin account found — aborting, nothing was touched.');
  console.log('Using admin as createdBy:', superAdmin.email);

  console.log('\n=== STEP 1: Wiping test/demo data ===');
  const before = {
    students: await Student.countDocuments(),
    certificates: await Certificate.countDocuments(),
    courses: await Course.countDocuments(),
    faculties: await Faculty.countDocuments(),
    grades: await Grade.countDocuments(),
    activity: await ActivityLog.countDocuments(),
  };
  console.log('Before:', before);

  await Promise.all([
    Student.deleteMany({}),
    Certificate.deleteMany({}),
    ActivityLog.deleteMany({}),
    Course.deleteMany({}),
    Faculty.deleteMany({}),
    Grade.deleteMany({}),
  ]);
  console.log('Wiped students, certificates, activity log, courses, faculties, grades.');
  console.log('(Admins and Settings were left untouched.)');

  console.log('\n=== STEP 2: Loading prepared legacy data ===');
  const records = JSON.parse(fs.readFileSync(CLEAN_JSON, 'utf-8'));
  console.log(`Loaded ${records.length} clean records from ${CLEAN_JSON}`);

  const courseNames = [...new Set(records.map((r) => r.courseName))];
  const facultyNames = [...new Set(records.map((r) => r.facultyName))];

  console.log(`\n=== STEP 3: Creating ${courseNames.length} courses, ${facultyNames.length} faculty, ${GRADE_LABELS.length} grades ===`);
  const courseDocs = await Course.insertMany(courseNames.map((name) => ({ name, isActive: true })));
  const facultyDocs = await Faculty.insertMany(facultyNames.map((name) => ({ name, isActive: true })));
  const gradeDocs = await Grade.insertMany(GRADE_LABELS.map((label) => ({ label, isActive: true })));

  const courseMap = new Map(courseDocs.map((d) => [d.name, d._id]));
  const facultyMap = new Map(facultyDocs.map((d) => [d.name, d._id]));
  const gradeMap = new Map(gradeDocs.map((d) => [d.label, d._id]));

  console.log('\n=== STEP 4: Reserving student ID block ===');
  const counterUpdate = await Settings.findOneAndUpdate(
    { key: 'studentCounter' },
    { $inc: { 'value.sequence': records.length } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  let nextSeq = counterUpdate.value.sequence - records.length + 1;

  console.log('\n=== STEP 5: Building documents (skipping any email+course / phone+course collisions) ===');
  const seenEmailCourse = new Set();
  const seenPhoneCourse = new Set();
  const skipped = [];
  const studentDocs = [];
  const certInputs = []; // paired with studentDocs by index

  for (const r of records) {
    const ecKey = `${r.email}|${r.courseName}`;
    const pcKey = `${r.phone}|${r.courseName}`;
    if (seenEmailCourse.has(ecKey) || seenPhoneCourse.has(pcKey)) {
      skipped.push({ reason: 'duplicate email+course or phone+course within dataset', ...r });
      continue;
    }
    seenEmailCourse.add(ecKey);
    seenPhoneCourse.add(pcKey);

    const courseId = courseMap.get(r.courseName);
    const facultyId = facultyMap.get(r.facultyName);
    const gradeId = gradeMap.get(r.gradeLabel);
    if (!courseId || !facultyId || !gradeId) {
      skipped.push({ reason: 'missing course/faculty/grade mapping', ...r });
      continue;
    }

    const studentId = `STU${String(nextSeq).padStart(6, '0')}`;
    nextSeq += 1;
    const _id = new mongoose.Types.ObjectId();

    studentDocs.push({
      _id,
      studentId,
      fullName: r.fullName,
      guardianName: r.guardianName,
      email: r.email,
      phone: r.phone,
      course: courseId,
      faculty: facultyId,
      grade: gradeId,
      startDate: new Date(r.startDate),
      endDate: new Date(r.endDate),
      certificateNumber: r.certificateNumber,
      certificateTemplateVersion: defaultTemplate.version,
      certificatePDF: true,
      status: 'issued',
      createdBy: superAdmin._id,
      createdAt: new Date(r.issueDate),
    });

    certInputs.push({
      certificateNumber: r.certificateNumber,
      student: _id,
      course: courseId,
      faculty: facultyId,
      grade: gradeId,
      studentNameSnapshot: r.fullName,
      guardianNameSnapshot: r.guardianName,
      courseNameSnapshot: r.courseName,
      facultyNameSnapshot: r.facultyName,
      gradeLabelSnapshot: r.gradeLabel,
      startDate: new Date(r.startDate),
      endDate: new Date(r.endDate),
      templateVersion: defaultTemplate.version,
      issueDate: new Date(r.issueDate),
      qrPayload: `${(process.env.FRONTEND_URL || 'https://mindq-certificate-frontend.vercel.app').replace(/\/$/, '')}/verification?number=${encodeURIComponent(r.certificateNumber)}`,
      status: 'issued',
      createdBy: superAdmin._id,
      createdAt: new Date(r.issueDate),
    });
  }

  console.log(`Prepared ${studentDocs.length} students/certificates, skipped ${skipped.length}`);

  console.log('\n=== STEP 6: Inserting (batched) ===');
  let insertedStudents = 0;
  let insertedCerts = 0;
  const insertErrors = [];

  for (const batch of chunk(studentDocs, 2000)) {
    try {
      const res = await Student.insertMany(batch, { ordered: false });
      insertedStudents += res.length;
    } catch (err) {
      const inserted = err.insertedDocs?.length || 0;
      insertedStudents += inserted;
      insertErrors.push({ collection: 'Student', message: err.message, inserted });
    }
    process.stdout.write(`\rStudents inserted: ${insertedStudents}/${studentDocs.length}`);
  }
  console.log();

  for (const batch of chunk(certInputs, 2000)) {
    try {
      const res = await Certificate.insertMany(batch, { ordered: false });
      insertedCerts += res.length;
    } catch (err) {
      const inserted = err.insertedDocs?.length || 0;
      insertedCerts += inserted;
      insertErrors.push({ collection: 'Certificate', message: err.message, inserted });
    }
    process.stdout.write(`\rCertificates inserted: ${insertedCerts}/${certInputs.length}`);
  }
  console.log();

  console.log('\n=== STEP 7: Fixing the certificate-number counter so future new certificates never collide ===');
  // Only the newly-minted sequential MQHYD0000NN numbers (assigned to resolve
  // the 89 historical collisions) live in this counter's own numbering space —
  // the original random legacy numbers don't. Scan for the highest such value.
  let maxSeq = 0;
  for (const r of records) {
    const m = /^MQHYD(\d{6})$/.exec(r.certificateNumber);
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
  }
  await Settings.findOneAndUpdate(
    { key: 'certificateCounter' },
    { key: 'certificateCounter', value: { sequence: maxSeq } },
    { upsert: true }
  );
  console.log(`certificateCounter set to ${maxSeq} — next new certificate will be MQHYD${String(maxSeq + 1).padStart(6, '0')}`);

  await ActivityLog.create({
    type: 'certificate_approved',
    actor: superAdmin._id,
    actorName: superAdmin.name,
    description: `Bulk-imported ${insertedStudents} historical students and ${insertedCerts} certificates from the legacy system`,
    meta: { insertedStudents, insertedCerts, skipped: skipped.length },
  });

  const outPath = CLEAN_JSON.replace('migration_clean.json', 'migration_import_result.json');
  fs.writeFileSync(outPath, JSON.stringify({ before, insertedStudents, insertedCerts, skipped, insertErrors }, null, 1));

  console.log('\n=== DONE ===');
  console.log(`Students inserted:    ${insertedStudents}`);
  console.log(`Certificates inserted: ${insertedCerts}`);
  console.log(`Skipped:               ${skipped.length}`);
  console.log(`Insert errors:          ${insertErrors.length}`);
  console.log(`Full result written to: ${outPath}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
