const mongoose = require('mongoose');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

  // Every Vercel cold start is a brand-new connection attempt against Atlas's
  // free-tier (M0) cluster. When several endpoints get invoked at once (e.g.
  // a dashboard firing 3-4 requests in parallel), several fresh containers
  // hit Atlas at the same instant — M0's shared, low-powered tier sometimes
  // refuses part of that burst outright ("Could not connect to any servers"),
  // even though the IP allowlist and credentials are fine. One retry after a
  // short pause almost always succeeds once the burst clears, instead of
  // failing the user-facing request over a one-off refusal.
  const attempts = [4000, 5000];
  let lastErr;
  for (let i = 0; i < attempts.length; i += 1) {
    try {
      await mongoose.connect(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: attempts[i] });
      console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
      return;
    } catch (err) {
      lastErr = err;
      console.error(`MongoDB connection attempt ${i + 1}/${attempts.length} failed:`, err.message);
      if (i < attempts.length - 1) await sleep(500);
    }
  }

  if (exitOnFailure) process.exit(1);
  else throw lastErr;
}

module.exports = connectDB;
