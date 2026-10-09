# Placement Management System (MERN)

College placement portal with three roles: **Student**, **Company** and **Admin (Placement Officer)**.

## Run it

Needs Node.js 18+ and your MongoDB Atlas connection string in `server/.env`.

```bash
npm install        # installs root, server and client packages
npm run seed       # optional: loads demo data (clears existing data!)
npm run dev        # server on :5000, client on :5173
```

Open http://localhost:5173

## Logins

| Role    | Email                | Password       |
|---------|----------------------|----------------|
| Admin   | admin@college.edu    | Admin@123      |
| Student | student1@college.edu | Password@123   |
| Company | hr@nimbus.com        | Password@123   |

The admin is created automatically on first server start. Student and company logins exist only after `npm run seed`.

## Flow

1. Company registers and waits as **pending**. Admin approves it, then it can sign in.
2. Company posts a drive. It is **pending** until the admin approves it, and only then do students see it.
3. Student completes the profile, uploads a PDF resume and applies. Eligibility (CGPA, department, deadline, resume) is checked on the server.
4. Company reviews applicants and moves them through shortlisted, interview and selected or rejected. Students see every update on their timeline.
5. Admin tracks placements in the dashboard and Reports page, and can export placed students as CSV.

## Structure

```
server/   Express 5 + Mongoose 9 API (JWT, bcrypt, multer)
  models/ controllers/ routes/ middleware/ utils/ seed.js
client/   React 18 + Vite + React Router + Recharts, plain CSS
  src/pages/{student,company,admin}  src/components  src/context
```

## Notes

- Resumes are saved in `server/uploads/resumes`.
- Change `JWT_SECRET` in `server/.env` before deploying anywhere.
- Never commit `.env` (it is already in `.gitignore`).
