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
   - `NODE_ENV` is set to `production`.
5. When it's live you'll get a URL like `https://bookswap.onrender.com`.

## Step 4 — Create your account

The tables are created automatically on first start (`prisma db push`) and the
database starts **empty** — no demo or seed data. Open your Render URL, click
**Sign up**, and create your account. That's it — you're running a real instance.

> **Keeping production clean:** if you ever ran the old demo seeder against this
> database, wipe it from the Render **Shell** tab with `cd server && npm run db:reset`
> (this drops and recreates the schema empty — it deletes all data).

---

## Local development

The database is Postgres, so local dev needs a Postgres URL too. The quickest
option is a local Docker container — see the **Getting started** section in
[README.md](README.md). In short:

```bash
npm run install:all
docker run -d --name bookswap-pg \
  -e POSTGRES_USER=bookswap -e POSTGRES_PASSWORD=bookswap -e POSTGRES_DB=bookswap \
  -p 5433:5432 postgres:16-alpine
cp server/.env.example server/.env   # set DATABASE_URL to the container above
cd server && npx prisma db push && cd ..
npm run dev
```

Prefer the cloud? Create a **second free Neon database** (or a Neon branch) for
local work and point `DATABASE_URL` at it instead of the Docker container.

## Updating the live site later

Just push to `main` — Render redeploys automatically:
```bash
git add -A && git commit -m "your change" && git push
```
