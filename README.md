# Skills Grid

A full-stack student and admin quiz application for the HTML Quiz course.

## 1) Install Node.js LTS

Download and install the current LTS version of Node.js from:

https://nodejs.org/

## 2) Install dependencies

Backend:

```bash
cd server
npm install
```

Frontend:

```bash
cd client
npm install
```

## 3) Configure MongoDB

Use MongoDB Atlas or install MongoDB Community Server locally. Confirm the database is running and reachable before starting the API. For Atlas, allow your machine's IP address and use a database user in the connection string.

## 4) Create .env files

Copy `server/.env.example` to `server/.env`, then set the MongoDB URI, a private random JWT secret, and the admin account credentials. The admin account is created or updated by the seed command; public admin signup is not available.

```env
MONGO_URI=mongodb://127.0.0.1:27017/skillsgrid
JWT_SECRET=replace_with-a-random-secret-at-least-32-characters-long
PORT=5000
CLIENT_URL=http://localhost:5173
ADMIN_NAME=Skills Grid Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-long-private-password
```

Client `.env` example:

```env
VITE_API_URL=http://localhost:5000/api
```

## 5) Seed the database

```bash
cd server
npm run seed
```

This synchronizes the quiz and its 80-question bank. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, it also provisions the admin account. Student accounts are created through student signup; no demo credentials are included.

## 6) Start the backend

```bash
cd server
npm run dev
```

## 7) Start the frontend

```bash
cd client
npm run dev
```

## Demo accounts

There are no built-in demo accounts. Create the administrator credentials privately in `server/.env`, run the seed command, and register student accounts from the signup page.

## Notes

- Student signup is public but always creates a student account.
- Admin login is separate from signup and is controlled server-side.
- The questions are stored in `server/data/questions.json` and the seed command can be rerun without deleting custom questions or duplicating the seeded bank.
- The frontend uses the Vite dev server on port 5173 by default.
- In Windows PowerShell, use `npm.cmd` in place of `npm` if script execution policy blocks `npm.ps1`.
