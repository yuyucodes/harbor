# Harbor

A campus marketplace for Boston college students to buy and sell used items, by auction or at a fixed price. Think eBay or Mercari, scoped to student communities and focused on technology and collectibles.

Harbor is an early-stage build made entirely with free tools. Checkout will use Stripe test mode, so no real money moves.

## Status

Work in progress. The backend comes first, then the web app.

- [x] Monorepo, local services, database schema and migrations
- [x] Student sign-up with `.edu` email verification, login, and Redis sessions
- [ ] Listings API (create, browse, detail) *(in progress)*
- [ ] Bidding with row-level locking and a 100-simultaneous-bids test
- [ ] Auctions that close automatically, last-minute bid extensions, live price updates
- [ ] Photo uploads and image processing
- [ ] Test-mode payments and buyer-seller messaging
- [ ] Web app (Next.js) with light and dark themes
- [ ] Deployment

## Planned features

- Sellers choose **auction** or **buy now** per listing, with a description, condition, photos, delivery method, and a seller-set delivery fee
- Live countdown and price on the item page
- Messaging between buyer and seller opens after a sale
- "Unsold" tab under My Listings with one-click relisting
- Reporting and blocking, with an audit log for bids and payments

## Tech stack

| Layer | Choice |
|---|---|
| Web | Next.js, Tailwind CSS |
| API | Node.js, TypeScript, Fastify, Zod |
| Database | PostgreSQL with Prisma 7 |
| Cache and queues | Redis, BullMQ |
| Payments | Stripe (test mode) |
| Local services | Docker Compose (Postgres, Redis, Mailpit) |
| Tests | Vitest, Playwright, k6 |

## Design decisions

- **Bids are race-safe.** A bid runs in one database transaction that locks the listing row, and a unique constraint on `(listing, amount)` backs it up.
- **Auction close is idempotent.** A retried job can't close an auction twice or create two orders.
- **Webhooks are idempotent.** Stripe event IDs are recorded so a retried event does nothing the second time.
- **Sessions live in Redis** as httpOnly cookies, so they can be revoked on the server.
- **Accounts don't leak.** Signup and login give the same response whether or not an email exists.
- **Money is stored as whole cents**, never floating-point.

## Getting started

You need Node.js (current LTS), pnpm, and Docker.

```bash
git clone <repo-url> harbor
cd harbor
pnpm install
```

If pnpm reports ignored build scripts, run `pnpm approve-builds` and allow `argon2`, `esbuild`, `prisma`, and `@prisma/engines`, then `pnpm install` again.

Start the local services:

```bash
docker compose up -d
```

Set up and run the API:

```bash
cd apps/api
cp .env.example .env
pnpm prisma generate
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm dev
```

The API listens on http://localhost:4000. Verification emails are caught by Mailpit at http://localhost:8025, so nothing is really sent.

Run the tests:

```bash
pnpm test
```

## Project structure

```
apps/
  api/          Fastify API, Prisma schema and migrations
  web/          Next.js app (not started)
packages/
  shared/       Validation schemas and helpers used by both apps
docs/           Planning documents
```

## Documentation

Planning documents live in [`docs/`](docs/): product decisions, architecture and security checklist, site map and API routes, design system and tokens, component specs (item tile, bid panel), and the database schema.

## License

Not yet chosen.
