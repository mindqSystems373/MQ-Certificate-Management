const Settings = require('../models/Settings');

const NUMBERING_KEY = 'certificateNumbering';
const COUNTER_KEY = 'certificateCounter';

/**
 * Generates the next certificate number atomically.
 *
 * Why a Settings-backed counter instead of `Certificate.countDocuments() + 1`:
 * two admins submitting at the same moment could both read the same count and
 * mint the same certificate number, which the PRD explicitly forbids ("Never
 * Duplicate"). findOneAndUpdate with $inc is a single atomic Mongo operation,
 * so concurrent requests always get distinct, gapless sequence values.
 *
 * Prefix/padding are read from Settings (seeded from env) rather than hardcoded,
 * so numbering scheme can change without a deploy.
 */
async function getNextCertificateNumber() {
  const numbering = await Settings.findOne({ key: NUMBERING_KEY });
  const prefix = numbering?.value?.prefix || process.env.CERTIFICATE_PREFIX || 'MQHYD';
  const padLength = numbering?.value?.padLength ?? Number(process.env.CERTIFICATE_PAD_LENGTH ?? 6);

  const counter = await Settings.findOneAndUpdate(
    { key: COUNTER_KEY },
    { $inc: { 'value.sequence': 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const sequence = counter.value.sequence;
  const padded = String(sequence).padStart(padLength, '0');
  return `${prefix}${padded}`;
}

module.exports = { getNextCertificateNumber };
