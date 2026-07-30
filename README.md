# Mind Q Systems — Certificate Management System

Modern React + Node.js + MongoDB rebuild of Mind Q Systems' legacy PHP certificate
platform. Two role-based dashboards (Super Admin, Management), atomic certificate
numbering, and certificates rendered directly onto the company's real certificate
artwork.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for setup (including a step-by-step
MongoDB Atlas guide), [`docs/API.md`](docs/API.md) for the REST API, and
[`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) for how to use both dashboards.

## Quick start

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI and JWT_SECRET
npm run seed
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:5000

Demo logins (created by `npm run seed`):
- Super Admin — `admin@mindq` / `mindq@admin`
- Management — `management@mindq` / `mindq@management`

## Stack

React (Vite) · Tailwind CSS · Zustand · React Query · Express · Mongoose ·
JWT auth · PDFKit (rendered onto the client's own certificate artwork) · MongoDB
