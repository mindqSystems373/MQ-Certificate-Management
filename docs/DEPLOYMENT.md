# Deployment Guide

## 1. Prerequisites

- Node.js 18+
- A MongoDB database — pick one:
  - **Local**: install [MongoDB Community Server](https://www.mongodb.com/try/download/community) and run it (`mongod`), or run it via Docker: `docker run -d -p 27017:27017 --name mindq-mongo mongo:7`
  - **Cloud (recommended — this is what production/deployment uses)**: a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) cluster — no local install, reachable from anywhere, and it's what a hosted backend (Render/Railway/Vercel/etc.) needs since those hosts can't reach a database running on your own laptop.

## 1a. Get a MongoDB Atlas connection string (step by step)

1. Go to https://www.mongodb.com/cloud/atlas/register and sign up (Google/GitHub sign-in works, or email+password). This is a real account on MongoDB's site — only you can create it, so do this part yourself.
2. After signup you land in a wizard: choose **"M0 Free"** cluster tier (0$, no credit card required). Pick any cloud provider (AWS is fine) and a region close to you. Name it anything, e.g. `mindq-cluster`. Click **Create**.
3. **Create a database user** (prompted automatically, or Database Access in the left sidebar → "Add New Database User"):
   - Authentication method: Password
   - Username: e.g. `mindq_admin`
   - Password: click "Autogenerate Secure Password" and **copy it somewhere safe** — you won't see it again.
   - Database User Privileges: "Read and write to any database" (default) is fine.
4. **Allow network access** (Network Access in the left sidebar → "Add IP Address"):
   - For getting started / this demo: click **"Allow Access from Anywhere"** (adds `0.0.0.0/0`). This is what lets a cloud-hosted backend connect — Atlas has no way to know your host's IP in advance.
   - (For a hardened production setup later, replace this with your hosting provider's specific outbound IP ranges.)
5. Go to **Database** in the left sidebar → click **Connect** on your cluster → **"Drivers"** → select Node.js. Atlas shows a connection string like:
   ```
   mongodb+srv://mindq_admin:<password>@mindq-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the real password from step 3, and add a database name before the `?`, e.g.:
   ```
   mongodb+srv://mindq_admin:YOUR_PASSWORD@mindq-cluster.xxxxx.mongodb.net/mindq_certificates?retryWrites=true&w=majority
   ```
7. That full string is your `MONGO_URI`. Paste it into `backend/.env`, or share it in chat and it'll be wired in directly.

**Security note:** this connection string contains a real password — treat it like any other secret (don't commit it to a public repo; it's already excluded via `.gitignore`, and `.env.example` only has a placeholder).

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb://127.0.0.1:27017/mindq_certificates   # or your Atlas connection string
JWT_SECRET=<generate a long random string>
CLIENT_URL=http://localhost:5173
```

Seed reference data (admin accounts, sample courses/faculties/grades, default certificate template):

```bash
npm run seed
```

Start the API:

```bash
npm run dev      # nodemon, auto-restart
# or
npm start        # plain node
```

The API runs on `http://localhost:5000`. Health check: `GET /api/health`.

### No MongoDB installed yet? (offline evaluation only)

```bash
npm run dev:memory
```

This boots a temporary, **in-memory** MongoDB, seeds it, and starts the API — no install required. Data is lost when the process stops; it exists purely so the app can be clicked through before committing to a real database. Do not use it for anything beyond a quick look.

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api/*` to `http://localhost:5000` (see `vite.config.js`). Log in with the seeded accounts:

- Super Admin: `admin@mindq.example` / `Admin@123`
- Management: `management@mindq.example` / `Manage@123`

**Change these passwords (or create new admin accounts and disable the seeded ones) before any real deployment.**

## 4. Production build

```bash
cd frontend
npm run build        # outputs frontend/dist
```

Serve `frontend/dist` from any static host (Vercel, Netlify, S3+CloudFront, or Nginx). Point it at the deployed backend by setting the API base URL — either keep a reverse-proxy `/api` route to the backend (matching the dev proxy), or set `VITE_API_URL` and update `src/api/axiosClient.js`'s `baseURL` accordingly.

## 5. Suggested hosting

| Piece | Options |
|---|---|
| Backend (Node/Express) | Render, Railway, Fly.io, an EC2/VM behind Nginx |
| Database | MongoDB Atlas (free tier is enough for a demo) |
| Frontend (static build) | Vercel, Netlify, Cloudflare Pages |
| Certificate PDFs | Currently written to `backend/storage/certificates/` on local disk. On a host with an ephemeral filesystem (e.g. most PaaS dynos), switch `pdfService.js` to write to S3/Cloud Storage before going to production — the PRD's "Future: AWS S3" migration note. |

## 6. Environment variables reference

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Signs auth tokens — use a long random value, never commit it |
| `JWT_EXPIRES_IN` | no (default `8h`) | Normal session length |
| `JWT_REMEMBER_EXPIRES_IN` | no (default `30d`) | Session length when "Remember me" is checked |
| `CLIENT_URL` | yes | Allowed CORS origin |
| `SMTP_HOST`/`PORT`/`USER`/`PASS`/`FROM` | no | If unset, "Resend Certificate" is simulated instead of actually emailing |
| `CERTIFICATE_PREFIX` / `CERTIFICATE_PAD_LENGTH` | no | Only used the very first time the counter is seeded; after that, numbering is controlled via the `Settings` collection so it can change without a redeploy |

## 7. Migrating from the legacy PHP system

This demo was built so a later production migration is additive, not a rewrite:

- Every issued certificate stores `templateVersion` — old certificates keep rendering under the template they were issued with even after the template is edited.
- Certificate numbering lives in the `Settings` collection (not hardcoded), so the legacy system's last-issued number can be used to seed the counter and continuity is preserved.
- Student/Certificate documents are separate collections with stable shapes; a legacy data import can populate them directly without touching API contracts or frontend code.
