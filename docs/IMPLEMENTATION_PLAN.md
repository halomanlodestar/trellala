# Trellala — Implementation Plan

Phased build plan for [ARCHITECTURE.md](ARCHITECTURE.md). Each phase ends with something usable and testable. Phases 0–4 give an MVP the team can use day to day by entering hackathons by hand. Phases 5–6 add the worker and ingestion, which is what Trello data migration needs.

**Testing throughout:** `bun test` covers `packages/core` against a real Postgres (local install or a dev database; no Docker). Pure logic (diffing, ranking, archive rules) gets table-driven unit tests. UI is checked by hand at the end of each phase.

---

## Phase 0 — Foundation

**Goal:** the monorepo builds, the database migrates, and the shared plumbing exists.

- **Workspace**
  - Rename `apps/web` to `@trellala/web`, or point the root scripts at `web`. Right now the root `--filter @trellala/web` matches nothing.
  - Remove `packageManager`, `ignoreScripts` and `trustedDependencies` from `apps/web/package.json`; the root owns them.
  - Root scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate`, `db:studio`.
- **`packages/config`:** a shared `tsconfig.base.json` that each package extends.
- **Local services:** your own Postgres and Redis (no Docker), configured via `.env`.
- **`packages/db`**
  - Prisma 7, `prisma.config.ts`, and the schema that already exists.
  - Export a client singleton.
  - The first migration, plus hand-written SQL for the three partial unique indexes (Milestone event key, Milestone team key, one open Conflict per field).
  - A seed script with sample users and hackathons of several types.
- **`packages/core` skeleton**
  - An `Actor` type and a `withActivity(tx, actor, entry)` helper.
  - The ActivityLog writer.
  - `time/` helpers (UTC ↔ IST using `@date-fns/tz`).
  - A zod env loader.
- **`.env.example`** listing every variable.

**Done when:** `bun db:migrate`, `bun dev` and `bun test` all work from the root.

---

## Phase 1 — Auth and app shell

**Goal:** you can sign in with Google and see the app layout.

- BetterAuth with the Prisma adapter and the Google provider, mounted at `/api/auth/[...all]`. Open signup.
- Route protection: Next 16 uses `proxy.ts` instead of the old middleware. Check `node_modules/next/dist/docs` before writing it. Add a server-side `requireUser()` helper as well.
- shadcn/ui setup (on the existing Tailwind 4), the TanStack Query provider and `lib/query-keys.ts`, and the `ActionResult` and `api-response` helpers (see [CONVENTIONS.md](CONVENTIONS.md)).
- The layout: top nav, avatar menu, and an empty slot for the review banner.
- `/login`, `/settings/profile` (name and skills), and `/people` (users with their skills).

**Done when:** a new Google account can sign in, edit their skills, and appear on `/people`.

---

## Phase 2 — Hackathons, milestones and prizes

**Goal:** you can enter hackathons by hand and see their full timelines.

- **Core**
  - `hackathons.create/update` and `milestones.create/update/delete`, plus the same for prizes.
  - Every edit sets `fieldSources[field] = "user:<id>"` and writes to ActivityLog.
  - `normalizeUrl()`.
  - Lifecycle templates per `HackathonType`.
  - Manual `archive` and `unarchive` with a reason.
- **Zod schemas** shared by the forms and, later, ingestion.
- **Pages**
  - `/hackathons`: a table with the basic columns, sorted by date added for now.
  - `/hackathons/new`: picking a type pre-fills the milestones.
  - `/hackathons/[id]`: the Overview and Activity tabs.
  - `/hackathons/[id]/edit`.
- **Inputs and display:** all date inputs are read as IST, and all times are shown in IST.
- **Tags:** free-text input, suggesting tags already in use (`SELECT DISTINCT unnest(tags)`).

**Done when:** you can create a buildathon from its template, edit dates, add an INR prize and a crypto prize, archive it by hand, and see each step in its Activity tab.

---

## Phase 3 — Teams and progress

**Goal:** several independent teams can enter the same hackathon.

- **Core**
  - `teams.create/update/setStatus`, `teams.addMember/removeMember`.
  - Enforce one team per user per hackathon (keeping `hackathonId` consistent on TeamMember).
  - Team-size warnings.
  - `progress.set(teamId, milestoneId, state, proof)`, which creates TeamMilestone rows lazily.
  - Team-only milestones.
- **Pages**
  - The Teams tab on the hackathon detail page: team cards with members, idea, links, status and a milestone checklist.
  - `/hackathons/[id]/teams/[teamId]`.

**Done when:** you can put two teams of two in one hackathon, tick off milestones for each separately, give one team an internal milestone, and see every action logged.

---

## Phase 4 — Ranking, action queue and My work (MVP)

**Goal:** the home page answers "what needs doing now?"

- **Core:** `ranking.nextAction(team)`, `ranking.nextAction(hackathon)`, and `ranking.priority(hackathon)` with constant weights. These have unit tests.
- **Pages**
  - `/`: the action queue grouped Overdue / Today / Next 3 days / This week / Later, with countdowns, members, and mark done or skipped right from the row.
  - `/hackathons`: next action column, sorting (deadline, priority, prize, added), filters (tags, type, mode, stage, member), and a board view by `stage`.
  - `/me`.
- **Display:** red styling for overdue or missed items. Until Phase 5 this is computed when the page loads.

**Done when:** the team can use it in place of Trello for new hackathons entered by hand.

**Optional early deploy:** at this point the web app and RDS can go live on AWS (see Phase 8) while the remaining phases are built.

---

## Phase 5 — Worker and automatic archiving

**Goal:** archiving and missed deadlines happen without anyone touching them.

- **`packages/queue`:** queue names, job payload types, a Redis connection factory, enqueue helpers.
- **`apps/worker`:** a Bun process that runs the BullMQ workers and shuts down cleanly.
- **Core**
  - `archive.evaluate(hackathonId)` implements the rules in order: mark MISSED, NO_TEAM_REGISTERED, ALL_TEAMS_OUT, CONCLUDED, and auto-unarchive for system archives. Unit-test every rule.
  - Call `evaluate` at the end of every relevant core mutation.
- **`archive-sweep` repeatable job:** every 15 minutes, evaluates every active hackathon that has a deadline since the last run.
- **Pages:** `/archive` with reason filters and an unarchive button. Archived hackathons are excluded from the queue, the list and the timeline.

**Done when:** a deadline that passes with one team not done turns that team red; when both teams miss, the hackathon moves to the Archive with reason ALL_TEAMS_OUT and actor SYSTEM.

---

## Phase 6 — Ingestion and conflict review

**Goal:** external scrapers and cron jobs can push data in, and clashes are resolved by people.

- **API keys:** `/settings/api-keys` to create one (the full key is shown once and only a hash is stored), list them, and revoke them. Add a bearer auth helper.
- **API**
  - `POST /api/v1/ingest`: validates each item with zod; valid items get an IngestEvent (QUEUED) and a job, invalid items are stored as FAILED; returns the event IDs.
  - `GET /api/v1/ingest/:id`.
  - `GET /api/v1/hackathons?source=&externalId=`.
- **Ingest processor (worker, concurrency 1)**
  - `ingest.flatten(payload)`: turns a payload into field paths, keyed by milestone and prize `key`.
  - `ingest.match()`: by `(source, externalId)`, then `normalizedUrl`.
  - `ingest.diff()`: each field ends up unchanged, applied, added, or a clash.
  - `ingest.apply()`: one transaction per event. Updates `fieldSources`, opens or appends conflicts, writes ActivityLog, then calls `archive.evaluate`.
  - Retries with backoff, then marks the event FAILED.
  - This is the riskiest logic, so it gets the most tests: same source updates, a human edit followed by an ingest, three sources on one field, a new milestone key, a payload that omits a milestone, an identical re-send.
- **Core:** `conflicts.resolve(conflictId, value, note)`.
- **Pages**
  - The global review banner (open conflicts plus FAILED events).
  - `/review` with Conflicts and Failed tabs.
  - `/review/conflicts/[id]` and `/review/ingest/[eventId]`, which can retry or discard.
  - The Sources tab on the hackathon detail page.
- **Docs:** a short `docs/INGEST_API.md` with the payload schema and examples for scraper authors.

**Done when:** a sample scraper script can POST a batch twice with no duplicates; a second source with a different deadline opens a conflict; resolving it applies the value and logs it.

---

## Phase 7 — Timeline and global activity

- `/timeline`: a Gantt view of active hackathons, expandable into team rows, with milestone markers, a today line, and week/month zoom. Pick a library (or plain CSS grid) here.
- `/activity`: the global log with filters for actor, action, hackathon and date, paginated by cursor.

---

## Phase 8 — Deploy to AWS

- **Infrastructure (no Docker):**
  - One EC2 instance with Bun, Redis, and nginx or Caddy (TLS).
  - `web` and `worker` as systemd services (or pm2).
  - RDS Postgres.
  - Secrets in SSM Parameter Store.
  - The Google OAuth redirect URLs for production.
- **CI** (GitHub Actions): lint, typecheck and test; SSH or SSM into the instance; `git pull`, `bun install`, `bun run build`, `bun db:deploy`; restart the services.
- **Backups:** RDS automated backups enabled.

---

## Later (not scheduled)

MCP server over `packages/core` · notifications and digests · Discord bot · skill-based assignment suggestions · win/loss analytics · Trello import script (it's just another ingestor).

---

## Decisions to confirm before Phase 1

1. **Date library:** `date-fns` with `@date-fns/tz`.
2. **Postgres hosting:** RDS (recommended) or installed on the EC2 instance.
