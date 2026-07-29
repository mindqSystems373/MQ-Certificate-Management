# Mind Q Systems Certificate Management System — API Reference

Base URL (dev): `http://localhost:5000/api`

All endpoints (except `/auth/login` and `/health`) require:

```
Authorization: Bearer <JWT>
```

Every response has the shape:

```json
{ "success": true, "message": "...", "data": { } }
```

or, on error:

```json
{ "success": false, "message": "...", "details": [ { "field": "email", "message": "..." } ] }
```

---

## Auth

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/auth/login` | public | `{ email, password, rememberMe }` → `{ token, admin }` |
| GET | `/auth/me` | any | Current session's admin profile |
| POST | `/auth/logout` | any | Logs the logout event (JWT is stateless; client discards the token) |

## Students

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/students` | superadmin | Creates a student **and** generates its certificate + PDF in one call |
| GET | `/students` | any | `?q=&course=&faculty=&status=&dateFrom=&dateTo=&page=&limit=` |
| GET | `/students/:id` | any | Single student detail |

`POST /students` body:

```json
{
  "fullName": "Aarav Sharma",
  "guardianName": "Ramesh Sharma",
  "email": "aarav@example.com",
  "phone": "9876543210",
  "course": "<courseId>",
  "faculty": "<facultyId>",
  "grade": "<gradeId>",
  "startDate": "2026-01-01",
  "endDate": "2026-04-30"
}
```

Response `data`: `{ student, certificate, downloadUrl }`.

## Certificates

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/certificates/search` | any | `?q=&course=&faculty=&status=&dateFrom=&dateTo=&page=&limit=` |
| GET | `/certificates/:number` | any | Certificate detail by certificate number |
| GET | `/certificates/:number/download` | any | Streams the PDF (`Content-Type: application/pdf`) |
| POST | `/certificates/:number/resend` | superadmin, management | Emails the certificate, or simulates if SMTP isn't configured |

## Courses / Faculties / Grades

Same shape for all three resources (`/courses`, `/faculties`, `/grades`):

| Method | Path | Role |
|---|---|---|
| GET | `/<resource>` | any |
| POST | `/<resource>` | superadmin |
| PUT | `/<resource>/:id` | superadmin |
| DELETE | `/<resource>/:id` | superadmin (soft-deactivates, does not hard-delete) |

## Dashboard

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | any | Total/issued/pending records, generated today/this month |
| GET | `/dashboard/latest-certificates` | any | `?limit=5` |
| GET | `/dashboard/recent-activity` | any | `?limit=10` |

## Settings

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/settings/template` | any | Current certificate template config |
| PUT | `/settings/template` | superadmin | Updates the template; auto-bumps `version` |

## Error codes

| Status | Meaning |
|---|---|
| 400 | Validation failed (see `details`) |
| 401 | Missing/invalid/expired token, or bad login credentials |
| 403 | Authenticated but wrong role for this action |
| 404 | Resource not found |
| 409 | Duplicate value (email, phone, or certificate number already exists) |
| 500 | Unexpected server error |
