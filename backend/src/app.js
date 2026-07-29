const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const courseRoutes = require('./routes/courseRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

// Vercel (and most PaaS hosts) sit in front of the app as a reverse proxy and
// set X-Forwarded-For; without `trust proxy`, express-rate-limit refuses to
// trust that header (correctly, since blindly trusting it behind an
// untrusted proxy lets clients spoof their rate-limit identity) and throws.
// `1` trusts exactly one hop, matching Vercel's single edge proxy.
app.set('trust proxy', 1);

app.use(helmet());
// The frontend and backend are deployed as two separate Vercel projects, so
// the frontend's exact production URL isn't known until after the backend is
// already live. Rather than redeploy the backend once that URL exists, this
// allows CLIENT_URL (for local dev) plus any *.vercel.app origin (covers both
// projects' preview and production URLs) — acceptable for this demo; a
// hardened production setup would pin this to the final custom domain.
const allowedOriginPattern = /\.vercel\.app$/;
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === process.env.CLIENT_URL || allowedOriginPattern.test(new URL(origin).hostname)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Login is the most sensitive endpoint (brute-force target), so it gets a
// tighter limiter than the general API traffic limiter below.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);

app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is healthy', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/faculties', facultyRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
