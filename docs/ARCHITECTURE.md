# Trellala — Architecture

A private tool for tracking every hackathon the team is entering. Each hackathon has its full timeline, can have several independent teams, and is sorted by what needs attention next.

Data model: [`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma)

---

## 1. Scope

**Core (this design):** the domain model, the web app, the ingest API, the ingest worker, the archive rules and the activity log.

**Out of scope:** scrapers and cron scripts (they only call the ingest API), the MCP server (later; it will be a thin layer over `packages/core`), notifications, bots, auto-assignment and realtime updates.

---

## 2. Stack

| Concern | Choice |
|---|---|
| Language / runtime | TypeScript, Bun workspaces |
| Web + API | Next.js (App Router, server components, server actions, route handlers). No separate backend. |
| UI | shadcn/ui (sidebar shell, ⌘K command palette), TanStack Query, React Hook Form, motion (animations), @dnd-kit (board drag & drop), SVAR React Gantt (timeline), FullCalendar v7 (calendar) |
| DB | PostgreSQL + Prisma 7 |
| Auth | BetterAuth, Google sign-in, open signup |
| Queue | BullMQ on Redis, processed by the separate `apps/worker` process |
| Validation | zod (shared between API, worker and forms) |
| Hosting | AWS EC2 (web + worker as systemd services, no Docker), RDS Postgres, Redis |

Codebase rules: [CONVENTIONS.md](CONVENTIONS.md).

---

## 3. Monorepo layout

```
apps/
  web/            Next.js: UI, server actions, /api/v1/*, BetterAuth routes
  worker/         BullMQ processors: ingest, archive-sweep (repeatable)
packages/
  db/             Prisma schema, generated client, migrations, seed
  core/           ALL business logic: no Next.js, no BullMQ imports
    schemas/        zod: hackathon payload, forms, ingest payload
    hackathons/     create/update/archive/unarchive
    teams/          create, members, status, team-size checks
    milestones/     CRUD, team progress, lifecycle templates
    ingest/         match → diff → apply / open conflicts
    conflicts/      resolve
    archive/        rules + sweep
    ranking/        next-action + priority score
    activity/       log writer (used inside every mutation's transaction)
    time/           UTC ↔ IST helpers
  queue/          BullMQ queue names, job types, enqueue helpers (shared by web and worker)
  config/         tsconfig, eslint
```

The existing Create Next App at the repo root moves to `apps/web`.

**Rule:** `apps/*` are thin. A server action, an API route and a worker job each parse their input, get the actor, call one function in `core`, and return. Every function in `core` takes an `actor` (`{ type: USER | API_KEY | SYSTEM, id }`) and writes its `ActivityLog` row inside the same Prisma transaction as the change.

---

## 4. Runtime diagram

```
  Browser ──Google OAuth──▶ apps/web ───────────────┐
     │                        │  server actions     │
     └──── pages ◀────────────┤  (reads: RSC)       │
                              │                     ▼
  Scraper / cron ──Bearer──▶ /api/v1/ingest ──▶ packages/core ──▶ Postgres
                              │  1. insert IngestEvent (QUEUED)    ▲
                              │  2. enqueue {eventId}              │
                              ▼                                    │
                            Redis ──▶ apps/worker ─────────────────┘
                                       • ingest processor (concurrency 1)
                                       • archive-sweep (every 15 min)
```

---

## 5. Key flows

### 5.1 Ingest

1. `POST /api/v1/ingest` with `Authorization: Bearer <apiKey>` and a body of `{ hackathons: HackathonPayload[] }`.
2. The API validates each item with zod. Each valid item gets an `IngestEvent` (QUEUED) and a job with `jobId = eventId`. Invalid items are stored as FAILED events with the error. The response returns the event IDs.
3. The worker (concurrency 1) sets the event to PROCESSING and finds a match by `(source, externalId)`, then by `normalizedUrl`.
   - **No match:** it creates the hackathon, its milestones and its prizes. Every field gets `fieldSources = "ingest:<source>"`. Status becomes APPLIED.
   - **Match:** it flattens the payload into field paths (`name`, `teamSizeMax`, `milestones.<key>.endsAt`, `prizes.<key>.amount`, …) and decides each field separately:

     | Situation | Outcome |
     |---|---|
     | Value is the same as the database | unchanged |
     | No recorded source, or the same source as the recorded one | applied; `fieldSources` updated |
     | A different source (another ingestor **or a human edit**) set it | clash: the open `Conflict` for that field gets this candidate added (or created) |
     | A milestone or prize key that doesn't exist yet | added (an addition never clashes) |
     | A milestone or prize missing from the payload | ignored (ingest never deletes) |

   - The event ends as APPLIED, PARTIAL (some fields went to conflicts) or NO_CHANGE. Per-field results go in `result`.
4. On errors, BullMQ retries with backoff. After the last attempt the event becomes FAILED and appears in Review.
5. Each applied change writes an `ingest.applied` activity entry (actor `API_KEY`), and each new conflict writes `conflict.opened`.

### 5.2 Conflict resolution

The **Review** page lists open conflicts. For each one it shows the current value and source, plus every candidate with its source and when it arrived. The user picks one value or types their own, and can add a note.

`core.conflicts.resolve` then, in one transaction:
- applies the value
- sets `fieldSources[field] = "user:<id>"`
- marks the conflict RESOLVED
- writes a `conflict.resolved` activity entry
- re-runs the archive check for that hackathon

### 5.3 Human edits

Editing a field in the UI sets `fieldSources[field] = "user:<id>"`. So when a scraper later sends a different value, it becomes a conflict instead of silently overwriting the edit.

### 5.4 Archive rules

Archiving always applies to the whole hackathon.

**Manual:** archive with a reason (skill mismatch, low prize, no time, not interested, other) and a note, or unarchive. The user is the actor.

**Automatic:** `core.archive.evaluate(hackathonId)` runs in two places: on every relevant write (team status change, milestone progress, a resolved conflict, an applied ingest), and in the 15-minute sweep for deadlines that pass with nobody doing anything. Rules, checked in order:

1. Mark team progress MISSED. For each team, an event milestone with `requiresAction && isHardDeadline`, `endsAt < now`, and team state not DONE becomes MISSED, and the team becomes `MISSED` (shown in red; the hackathon stays active).
2. **NO_TEAM_REGISTERED:** the registration milestone has ended and there are zero teams.
3. **ALL_TEAMS_OUT:** at least one team exists and every team is MISSED, ELIMINATED or WITHDRAWN.
4. **CONCLUDED:** every event milestone has ended.

If a rule matches, the hackathon is archived with actor SYSTEM and that reason.

**Auto-unarchive:** if a hackathon was archived *by the system* and its rule no longer holds (for example a deadline extension was approved), it's unarchived. Manual archives are never undone automatically.

Team-only milestones (`teamId` set) never cause MISSED. The UI just shows them as overdue.

### 5.5 Next action and priority (`core.ranking`, calculated at read time)

- **Team next action:** the earliest event milestone that requires action, has not ended, and isn't DONE or SKIPPED for that team, combined with that team's own team-only milestones.
- **Hackathon next action:** the earliest next action across its teams. With no teams, it's the earliest upcoming event milestone (usually registration).
- **Priority score:** `w_u·urgency + w_v·value + w_f·fit − w_e·effort`.
  - Urgency rises steeply under 48 hours.
  - Value is `log(estimatedUsd)`.
  - The weights are constants in core.
- **Sort options:** next deadline (the default), priority, prize, date added.

At this scale the score is computed in TypeScript after a single query. Nothing is cached or stored.

### 5.6 Lifecycle templates

These are constants in `core/milestones/templates.ts`, one per `HackathonType`. Each is a list of `{ key, kind, title, requiresAction, isHardDeadline }`. Choosing a type in the create form fills in the milestones, leaving the dates blank. Ingested payloads bring their own milestones.

### 5.7 Time

All times are stored in UTC, and `sourceTimezone` is kept for reference. Every time is shown in IST (`Asia/Kolkata`), and form inputs are read as IST.

---

## 6. Auth

- **People:** BetterAuth with Google sign-in, open signup, session cookie. Every signed-in user can do everything; there are no roles.
- **Machines:** `ApiKey` sent as a bearer token. Only the hash is stored, the full key is shown once at creation, and `source` sets how the key's writes are labeled. Keys can be revoked.
- **Route protection:** `/api/auth/*` is public, `/api/v1/*` needs an API key, and all pages need a session (checked in the Next.js proxy/middleware and again in the server-side data layer).

---

## 7. API (v1)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/ingest` | Enqueue 1..N hackathon payloads; returns event IDs |
| GET | `/api/v1/ingest/:eventId` | Event status and per-field result |
| GET | `/api/v1/hackathons?source=&externalId=` | Lookup, so scrapers can check what already exists (optional) |

---

## 8. Page map

Global layout:
- A top nav: Queue · Hackathons · Timeline · My work · Archive · Review (badge) · Activity · People, with an avatar menu leading to Settings.
- A **review banner** on every page when there are open conflicts or FAILED events ("3 ingest items need review → Review").

| Route | Page | Contents |
|---|---|---|
| `/login` | Sign in | Google button |
| `/` | **Action queue** | Next actions for every team across active hackathons, grouped Overdue / Today / Next 3 days / This week / Later. Each row shows hackathon, team (or "no team yet"), milestone and action, IST time with countdown, members, and type/mode badges. Mark done or skipped right from the row. Teams that missed a deadline appear in red. Filters: tags, type, mode, "only mine". |
| `/hackathons` | **Hackathons** | Table / board toggle. Table columns: name, type, mode, tags, prize (estimatedUsd and summary), next action with countdown, teams count, stage. The board has columns by `stage`. Sort by deadline, priority, prize or added; filter by tags, type, mode, stage, member. |
| `/hackathons/new` | Create | Basics, then pick a type to get a milestone template, then prizes and tags. |
| `/hackathons/[id]` | **Hackathon detail** | Header: name, badges, source link, stage selector, Archive button. Tabs below. |
| ↳ Overview tab | | Vertical timeline of event milestones (past ones greyed, next one highlighted), requirements (team size, eligibility), prizes, tags, effort/fit, notes. |
| ↳ Teams tab | | One card per team: name, idea, members (with skills), status, links, and a checklist of event milestones plus team-only milestones. Team cards that missed a deadline appear in red. Buttons: "New team", "Add team milestone". Team-size warnings. |
| ↳ Activity tab | | ActivityLog for this hackathon. |
| ↳ Sources tab | | IngestEvents for this hackathon, `fieldSources` per field, and links to open conflicts. |
| `/hackathons/[id]/edit` | Edit | Edit fields, milestones and prizes. Saving marks the edited fields as user-sourced. |
| `/hackathons/[id]/teams/[teamId]` | Team detail | Linkable full view of one team: idea, members, its milestone checklist, status changes, activity. |
| `/timeline` | **Timeline** | Gantt chart with one row per active hackathon (expandable into one row per team), milestone markers, a today line, and week/month zoom. |
| `/me` | **My work** | The signed-in user's teams and next actions. |
| `/archive` | **Archive** | Archived hackathons, filterable by reason (manual reasons, Concluded, All teams out, No team registered). Unarchive button. Team outcomes (won/lost) for history. |
| `/review` | **Review** | Tabs: **Conflicts** (open conflicts grouped by hackathon) and **Failed ingests** (error and payload). |
| `/review/conflicts/[id]` | Resolve conflict | Field path, the current value and its source, candidate cards (source, value, received at). Pick a value or enter a custom one, add a note, resolve. |
| `/review/ingest/[eventId]` | Ingest event | Payload, status, per-field result, error. Retry (re-enqueue) or discard. |
| `/activity` | **Activity** | Global log, filterable by actor (user or API key), action, hackathon and date. |
| `/people` | **People** | Users with their skills and current active teams. Used for manual assignment. |
| `/settings/profile` | Profile | Name and skills (`String[]`). |
| `/settings/api-keys` | API keys | Create (full key shown once), list with last-used time, revoke. |

---

## 9. Deployment (AWS)

- **One EC2 instance, no Docker.** Processes are managed by systemd (or pm2):
  - `web`: `next start`, behind nginx or Caddy for TLS
  - `worker`: a long-running Bun process
  - Redis 7 (installed on the box with AOF persistence, or ElastiCache)
- **Postgres on RDS,** for managed backups.
- **Why not one process?** BullMQ workers are kept out of the Next.js process. Next can run several workers and reloads on change in dev, either of which would duplicate jobs. The web app only *enqueues* jobs.
- **Migrations:** `bun db:deploy` runs before `web` and `worker` restart.
- **Secrets** in SSM Parameter Store or Secrets Manager, loaded into `.env` at deploy: `DATABASE_URL`, `REDIS_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`.
- **Hand-written migration SQL** (Prisma can't express these):
  - Partial unique indexes on `Milestone` (event key; team key)
  - A partial unique index on `Conflict` (one open conflict per field)

---

## 10. Build order

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
