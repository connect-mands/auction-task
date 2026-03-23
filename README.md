# Lotline — real-time auction platform

Full-stack demo: Next.js (App Router) + Express + Socket.IO + PostgreSQL, optional Redis for Socket.IO scaling.

## Architecture (short)

- **API** (`server/`): REST for auth, auction listings, and placing bids; JWT in `Authorization` header. Socket.IO broadcasts `bid:update` to everyone subscribed to an auction room (`auction:<id>`).
- **Web** (`web/`): Dashboard with tabs (live / upcoming / completed), detail page with bid form and live activity feed. Countdowns poll `/api/auctions/time` once a minute to stay aligned with server time.
- **Postgres**: Users, items, auctions, bids, audit log (bid events plus admin actions).
- **Redis** (optional): If `REDIS_URL` is set, the API uses the Redis adapter so multiple API instances can share socket fan-out.

## Prerequisites

- Node 20+
- Docker (for Postgres + Redis) or your own Postgres instance

## Quick start (local)

1. **Start databases**

   ```bash
   docker compose up -d
   ```

2. **API**

   ```bash
   cd server
   cp .env.example .env
   # edit .env if needed; defaults match docker-compose
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed
   npm run dev
   ```

   API listens on `http://localhost:4000`.

3. **Web**

   ```bash
   cd web
   cp .env.local.example .env.local
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`.

**Seed accounts**

- Admin: `admin@example.com` / `demo12345`
- User: `mia@example.com` / `demo12345`

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `DATABASE_URL` | `server/.env` | Postgres connection string |
| `JWT_SECRET` | `server/.env` | Signing key for JWTs (set a long random string in production) |
| `PORT` | `server/.env` | API port (default `4000`) |
| `REDIS_URL` | `server/.env` | Optional; e.g. `redis://localhost:6379` |
| `NEXT_PUBLIC_API_URL` | `web/.env.local` | API origin for browser + Socket.IO client |

## Tests

```bash
cd server
npm test
```

Runs a small Node test file for auction status resolution.

## Production notes

- Run `npm run build` in both `server` and `web`; set `JWT_SECRET`, `DATABASE_URL`, and point `NEXT_PUBLIC_API_URL` at the public API URL.
- Consider Prisma migrations (`prisma migrate deploy`) instead of `db push` for production.
- Put TLS in front of the API and web (reverse proxy, managed hosting, etc.).

## Submission (per brief)

Email the repository link (and demo URL if hosted) to `hr@skyitsolution.co.in` with subject: **Full Stack Assessment – Mandeep Singh**.
