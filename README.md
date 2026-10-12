# Trellala

Hackathon tracker: timelines, teams and next actions across every hackathon we're entering.

- Design: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Rules: [docs/CONVENTIONS.md](docs/CONVENTIONS.md)
- Ingest API: [docs/INGEST_API.md](docs/INGEST_API.md)

```text
apps/web        Next.js app + /api/v1 (ingest)
apps/worker     BullMQ worker: ingest processing, archive sweep (every 15 min)
packages/core   all business logic
packages/db     Prisma schema + client
packages/queue  queue names + enqueue helpers
```

## Setup

You need Bun 1.3, Postgres 15 or later, and Redis 7. Docker isn't used.

1. Copy `.env.example` to `.env` at the repo root and fill it in:
   - `DATABASE_URL` and `REDIS_URL` point at your Postgres and Redis.
   - Generate `BETTER_AUTH_SECRET` with `openssl rand -base64 32`.
   - Create a Google OAuth client (type: Web) with the redirect URI `http://localhost:3000/api/auth/callback/google`, and put its ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
2. Install dependencies, generate the Prisma client, and set up the database:

   ```bash
   bun install         # also generates the Prisma client
   bun db:migrate      # creates tables (includes hand-written partial indexes)
   bun db:seed         # optional sample hackathons
   ```

   Database scripts, all run from the repo root:

   | Script | Does |
   | --- | --- |
   | `bun db:generate` | Regenerate the Prisma client (no DB needed) |
   | `bun db:migrate` | Apply migrations in dev; after a schema change, creates a new migration (asks for a name) |
   | `bun db:migrate:create` | Create a migration without applying it (to hand-edit SQL first) |
   | `bun db:deploy` | Apply pending migrations, without prompts (production/CI) |
   | `bun db:status` | Show which migrations are applied |
   | `bun db:reset` | Drop everything, re-apply migrations, re-seed (asks first) |
   | `bun db:seed` | Insert sample hackathons |
   | `bun db:studio` | Open Prisma Studio |

3. In two terminals, start the web app and the worker:

   ```bash
   bun dev             # http://localhost:3000
   bun dev:worker
   ```

## Checks

```bash
bun run typecheck
bun run lint
bun run test        # core rule tests
```

## Ingest example

Create an API key at `/settings/api-keys`, then run:

```bash
TRELLALA_API_KEY=trl_... bun scripts/ingest-example.ts
```
