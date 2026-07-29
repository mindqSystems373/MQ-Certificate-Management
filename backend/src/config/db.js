const mongoose = require('mongoose');

// process.exit(1) on failure is fine for a traditional long-running server
// (server.js) — a broken DB connection means the process should die and let
// the host restart it. On Vercel's serverless runtime that same exit() would
// tear down the whole function container mid-request, so this only exits
// when actually running under server.js (checked via an explicit flag) and
// otherwise just rethrows for the caller (api/index.js) to log/ignore —
// Mongoose's command buffering means a transient failure here doesn't
// necessarily fail the request that triggered it.
async function connectDB({ exitOnFailure = false } = {}) {
  if (mongoose.connection.readyState !== 0) return; // already connecting/connected — warm invocation reuse

  const uri = process.env.MONGO_URI;
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    if (exitOnFailure) process.exit(1);
    else throw err;
  }
}

module.exports = connectDB;
