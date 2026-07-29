// Vercel serverless entry point: every request is routed here (see
// vercel.json rewrites) and handled by the same Express app used locally.
// server.js (with its app.listen) is only for traditional/local hosting —
// Vercel invokes this exported app directly per-request, no listener needed.
require('dotenv').config();
const connectDB = require('../src/config/db');
const app = require('../src/app');

// Fire-and-forget: Mongoose buffers queries by default until the connection
// is ready, so requests that arrive before this resolves still work — they
// just wait on the buffered commands rather than failing. Warm invocations
// reuse the existing connection (connectDB is a no-op if already connected).
connectDB().catch((err) => console.error('Initial connect failed, will retry on next request:', err.message));

module.exports = app;
