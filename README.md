# Harborside

A campus marketplace for college students to buy and sell used items, by auction or at a fixed price. Think eBay or Depop, scoped to student communities and focused on technology and collectibles.

Harborside is an early-stage build made entirely with free tools.

## Status

Work in progress.

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
