# Deploying BookSwap for free (Neon + Render)

This app deploys as **one free service**: the Express server serves both the API
and the built React frontend. The database is a free **Neon Postgres** instance.
Cost: **₹0** — no credit card required for either service.

> Heads up: Render's free service **sleeps after ~15 min** of no traffic and takes
> ~30–60s to wake on the next request. That's normal and still free.

---

## Step 1 — Create the database (Neon)

1. Go to <https://neon.tech> and sign up (free, no card).
2. Create a new project (any name, e.g. `bookswap`). Pick a region near you.
3. On the project dashboard, click **Connect** and copy the **connection string**.
   It looks like:
   ```
   postgresql://user:pass@ep-xxxx.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this string handy — you'll paste it into Render in Step 3.

## Step 2 — Put the code on GitHub

1. Create a new **empty** repo at <https://github.com/new> (e.g. `bookswap`). Don't
   add a README/.gitignore — the project already has them.
2. In the project folder, push the code (the repo is already initialized locally):
   ```bash
   git remote add origin https://github.com/<your-username>/bookswap.git
   git branch -M main
   git push -u origin main
   ```

## Step 3 — Deploy on Render

1. Go to <https://render.com> and sign up with GitHub (free, no card).
2. Click **New → Blueprint**, select your `bookswap` repo. Render reads
   `render.yaml` automatically.
3. It will show one service (`bookswap`) and ask for the **DATABASE_URL** value
   (it's marked `sync: false` so it's never stored in git). Paste the Neon
   connection string from Step 1.
4. Click **Apply / Deploy**. First build takes a few minutes.
   - `JWT_SECRET` is generated for you.
   - `DEMO_MODE` is set to `false` and `NODE_ENV` to `production`.
5. When it's live you'll get a URL like `https://bookswap.onrender.com`.

## Step 4 — Load the demo data (once)

The tables are created automatically on first start (`prisma db push`), but they're
empty. To load the demo users/books once:

- In the Render dashboard, open your service → **Shell** tab, then run:
  ```bash
  cd server && npm run seed
  ```

You can now log in at your Render URL:
- **Email:** `raj@bookswap.in` **Password:** `raj123`

(With `DEMO_MODE=false`, one-tap account switching is disabled — everyone logs in
with email + password, which is correct for a real deployment.)

---

## Local development after this change

The database is now Postgres, so local dev needs a Postgres URL too. Easiest:
create a **second free Neon database** (or a Neon branch) for local work and put
its connection string in `server/.env` (`DATABASE_URL=...`). Then:

```bash
npm run install:all
cd server && npx prisma db push && npm run seed && cd ..
npm run dev
```

## Updating the live site later

Just push to `main` — Render redeploys automatically:
```bash
git add -A && git commit -m "your change" && git push
```
