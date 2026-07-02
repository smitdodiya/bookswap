# BookSwap 📚

A peer-to-peer book exchange platform — list books you own, find books near you, chat with owners, join reading communities, and lend/borrow with a two-sided confirmation flow.

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React (Vite) + React Router + Tailwind CSS |
| **Backend** | Node.js + Express (REST API) |
| **Database** | PostgreSQL via **Prisma ORM** |
| **Auth** | JWT + bcrypt (email / password) |

## Project structure

```
BookSwap/
├── server/                 # Express API + Prisma + PostgreSQL
│   ├── prisma/
│   │   └── schema.prisma   # data models
│   └── src/
│       ├── index.js        # app entry (also serves the built client in prod)
│       ├── prisma.js       # Prisma client
│       ├── middleware/     # JWT auth
│       └── routes/         # auth, books, users, chats, communities, lending
└── client/                 # React + Vite + Tailwind
    └── src/
        ├── components/     # Layout, BookCard, Modal, Icon, Avatar, ...
        ├── pages/          # Home, Profile, UserProfile, Chats, Communities, Requests, Login
        └── lib/            # api client, auth context, ui helpers
```

## Getting started (local development)

The app uses PostgreSQL. The quickest way to get a local database is Docker.

```bash
# 1. Install dependencies for both server and client
npm run install:all

# 2. Start a local Postgres (host port 5433 to avoid clashing with an existing 5432)
docker run -d --name bookswap-pg \
  -e POSTGRES_USER=bookswap -e POSTGRES_PASSWORD=bookswap -e POSTGRES_DB=bookswap \
  -p 5433:5432 postgres:16-alpine

# 3. Configure the server env (copy the example, then edit if needed)
cp server/.env.example server/.env
#   For the Docker Postgres above, set:
#   DATABASE_URL="postgresql://bookswap:bookswap@localhost:5433/bookswap?schema=public"

# 4. Create the database tables
cd server && npx prisma db push && cd ..

# 5. Run both servers together
npm run dev
```

- Client → http://localhost:5173
- API → http://localhost:4000 (proxied under `/api`)

Run them separately with `npm run dev:server` and `npm run dev:client`.

> The database starts **empty** — there is no seed/demo data. Open the app, click
> **Sign up**, create your account, and start adding books.

Already have Postgres running elsewhere (a local install, a cloud database, etc.)?
Skip step 2 and just point `DATABASE_URL` at it.

## Deploying to production

See [DEPLOY.md](DEPLOY.md) for a free single-service deploy (Neon Postgres + Render).

## Features

- **Auth** — email/password signup & login, JWT sessions.
- **My Shelf** — add books (title, author, condition, genre) via a modal, delete books, lent-out badge.
- **Search** — partial, case-insensitive title search with a city filter; results link to the owner's profile.
- **Profiles** — view anyone's shelf and message them.
- **Chats** — 1:1 messaging with an inbox + conversation thread.
- **Communities** — join/leave, member list, combined library, search within a community.
- **Lending tracker** — two-sided flow across statuses `Available → Pending → Lent out → Returning`:
  - *Give to someone*: owner picks a person → receiver confirms receipt → **Lent out**.
  - *Ask to borrow*: borrower requests → owner accepts → **Lent out**.
  - *Return*: holder starts a return → owner confirms → **Available**.
  - The **Requests** screen splits **Incoming** and **Outgoing**.

## Design tokens

- Cream background `#F5F0E8`, burnt-orange primary `#C4622D`
- Playfair Display (headings) + Inter (body)
- Book covers in sage / lavender / beige / terracotta / slate
- Sidebar nav on desktop, bottom nav on mobile
