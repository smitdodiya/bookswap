# BookSwap 📚

A peer-to-peer book exchange platform — list books you own, find books near you, chat with owners, join reading communities, and lend/borrow with a two-sided confirmation flow.

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React (Vite) + React Router + Tailwind CSS |
| **Backend** | Node.js + Express (REST API) |
| **Database** | SQLite via **Prisma ORM** |
| **Auth** | JWT + bcrypt (email / password) |

## Project structure

```
BookSwap/
├── server/                 # Express API + Prisma + SQLite
│   ├── prisma/
│   │   ├── schema.prisma   # data models
│   │   ├── seed.js         # demo data (12 users, 58 books, chats, requests, communities)
│   │   └── dev.db          # SQLite database (generated)
│   └── src/
│       ├── index.js        # app entry
│       ├── prisma.js       # Prisma client
│       ├── middleware/     # JWT auth
│       └── routes/         # auth, books, users, chats, communities, lending
└── client/                 # React + Vite + Tailwind
    └── src/
        ├── components/     # Layout, BookCard, Modal, Icon, Avatar, ...
        ├── pages/          # Home, Profile, UserProfile, Chats, Communities, Requests, Login
        └── lib/            # api client, auth context, ui helpers
```

## Getting started

From the repo root:

```bash
# 1. Install everything
npm run install:all

# 2. Set up the database + seed demo data (first time only)
cd server
npx prisma migrate dev --name init   # creates dev.db (skip if already done)
npm run seed
cd ..

# 3. Run both servers together
npm run dev
```

- Client → http://localhost:5173
- API → http://localhost:4000 (proxied under `/api`)

Or run them separately: `npm run dev:server` and `npm run dev:client`.

## Demo login

The login screen is pre-filled with the demo user:

- **Email:** `raj@bookswap.in`
- **Password:** `raj123`

Every other seeded user (Meera, Aarav, Priya, …) uses the password `password`.

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
