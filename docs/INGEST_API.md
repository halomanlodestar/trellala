# Ingest API

How to push hackathons into Trellala from a script, a cron job or another agent, one at a time or in bulk. Everything here matches what the server enforces (`packages/core/src/schemas/ingest.ts`). A minimal working client is in [`scripts/ingest-example.ts`](../scripts/ingest-example.ts).

---

## 1. Before you start

| You need | Where |
|---|---|
| Base URL | `http://localhost:3000` locally, or the deployed URL |
| An API key | Create one at **/settings/api-keys**. The full key (`trl_…`) is shown **once**. |
| The worker running | `bun dev:worker` (needs Redis). The API only queues items; the worker writes them. |

Every key has a **source** label (for example `trello`, `devfolio`, `sheet-import`). Everything sent with that key is recorded under that source, and that's how re-sends are matched. **Use one key per dataset.** Don't reuse a scraper's key for a one-off import.

The source comes from the key. A payload can't set it.

---

## 2. Bulk import, step by step

1. **Map** each record in your data to a hackathon object (§4). Give every hackathon a stable `externalId` (your own ID for it), and every milestone and prize a stable `key`.
2. **Split** into batches of at most **100 hackathons**, with each request body under **2 MB**.
3. **POST** each batch to `/api/v1/ingest` (§3). Send batches one after another, not in parallel; the worker processes one item at a time anyway.
4. **Read the 202 response.** Each item is either `queued` or `invalid`. Fix invalid items using `issues` and send them again. A bad item never blocks the rest of its batch.
5. **Wait, then verify.** Poll `GET /api/v1/ingest/:eventId` (§6) until no item is `QUEUED` or `PROCESSING`. Then review `PARTIAL` and `FAILED` items.
6. **Re-running is safe.** Sending the same data again changes nothing. Sending corrected data updates the same hackathons (§7).

On a network error or a 5xx response, retry the same batch after a short wait. Items already stored match on re-send, so a retry never creates duplicates.

---

## 3. `POST /api/v1/ingest`

```http
POST /api/v1/ingest
Authorization: Bearer trl_…
Content-Type: application/json

{ "hackathons": [ { …hackathon… }, … ] }
```

- `hackathons`: 1 to 100 items. More than 100 → `413`.
- Body at most 2 MB → otherwise `413`.
- Each item is validated on its own.

---

## 4. Request body reference

**Rules for every field.** Strings are trimmed. On an **update**, an omitted field is left as it is, and an explicit `null` clears it. Ingest **never deletes** milestones or prizes; leaving one out of a later payload leaves it in place.

### 4.1 Hackathon

| Field | Type | Required | Limits | Default when created | Notes |
|---|---|---|---|---|---|
| `externalId` | string | **one of these two** | 1–200 chars | – | Your stable ID. Primary match key, scoped to the key's source. |
| `sourceUrl` | http(s) URL | **one of these two** | ≤ 2048 | – | Fallback match key, compared ignoring `www.`, trailing `/` and letter case. Shown as the "Source" link. |
| `name` | string | **yes** | 1–200 | – | |
| `description` | string \| null | | ≤ 20000 | null | |
| `type` | enum | | see §4.4 | `OTHER` | Sets the badge and the default milestone template in the UI. |
| `mode` | enum | | `ONLINE` `OFFLINE` `HYBRID` | `ONLINE` | |
| `location` | string \| null | | ≤ 200 | null | |
| `teamSizeMin` | integer \| null | | 1–100 | null | Used for team-size warnings. |
| `teamSizeMax` | integer \| null | | 1–100 | null | |
| `eligibility` | string \| null | | ≤ 4000 | null | |
| `estimatedUsd` | number \| null | | ≥ 0 | null | Total prize value in USD. Drives the prize sort, the priority score and the "$" shown on lists and the timeline. Convert other currencies yourself. |
| `tags` | string[] | | ≤ 30 tags, each 1–40 chars | `[]` | Lowercased. |
| `milestones` | Milestone[] | | ≤ 50 | `[]` | The timeline (§4.2). |
| `prizes` | Prize[] | | ≤ 100 | `[]` | §4.3 |

Not settable through the API (they're set by people in the app): stage, notes, fit score, effort estimate, **teams, team members and team progress**.

### 4.2 Milestone

Milestones are a hackathon's timeline. They drive the queue, the deadlines, the timeline lanes and auto-archiving.

| Field | Type | Required | Limits | Default | Notes |
|---|---|---|---|---|---|
| `key` | string | recommended | 1–80, `^[a-z0-9_-]+$` | derived | Stable identity within the hackathon (§4.5). |
| `kind` | enum | **yes** | see §4.4 | – | |
| `title` | string | **yes** | 1–200 | – | Shown everywhere. Keep it short ("Final submission"). |
| `endsAt` | date | **yes** | §4.6 | – | The deadline, or the end of a window. |
| `startsAt` | date \| null | | §4.6 | null | Set it for **windows** (registration open → close, build period, judging). With it, the timeline draws a bar from start to end; without it, a single tick at `endsAt`. |
| `action` | string \| null | | ≤ 4000 | null | What has to be done ("Repo + 3 min video"). Shown in the queue. |
| `requiresAction` | boolean | | | `true` | `false` = informational (results day, event start). Info milestones never appear in the queue and never count against a team. |
| `isHardDeadline` | boolean | | | `true` | `true` = missing it puts a team out (it's marked **MISSED**, shown in red). Use `false` for soft dates (demo day, check-ins). |
| `sourceTimezone` | string \| null | | ≤ 64 | null | For reference only, e.g. `"America/Los_Angeles"`. Dates are not converted using it. |

The defaults mean **a milestone is a hard action deadline unless you say otherwise.** Set `requiresAction: false` for anything that is just a date on the calendar.

### 4.3 Prize

| Field | Type | Required | Limits | Default | Notes |
|---|---|---|---|---|---|
| `key` | string | recommended | 1–80, `^[a-z0-9_-]+$` | slug of `title` | §4.5 |
| `title` | string | **yes** | 1–200 | – | "1st place", "Best AI track" |
| `kind` | enum | **yes** | `CASH` `CRYPTO` `NON_MONETARY` | – | |
| `amount` | number \| null | | ≥ 0 | null | In `currency`, as published (decimals allowed for crypto). |
| `currency` | string \| null | | ≤ 16 | null | `INR`, `USD`, `ETH`, `USDC`… (uppercased). |
| `description` | string \| null | | ≤ 2000 | null | |
| `estimatedUsd` | number \| null | | ≥ 0 | null | This prize's value in USD. |

### 4.4 Enums

- **`type`:** `BUILDATHON` `IDEATHON` `CTF` `DSA` `GRANT` `BOUNTY` `OTHER`
- **`mode`:** `ONLINE` `OFFLINE` `HYBRID`
- **Milestone `kind`:** `REGISTRATION` `TEAM_FORMATION` `IDEA_SUBMISSION` `SHORTLIST` `ROUND` `PROTOTYPE` `FINAL_SUBMISSION` `DEMO` `EVENT_START` `EVENT_END` `RESULTS` `REPORT` `PAYOUT` `CUSTOM`
- **Prize `kind`:** `CASH` `CRYPTO` `NON_MONETARY`

Enum values are case-sensitive and must be uppercase.

### 4.5 Keys (milestones and prizes)

Updates are matched by key, so **keys must stay the same between runs.**

- Send an explicit `key` whenever you can: `registration`, `round_1`, `final_submission`, `1st`, `track_ai`.
- Without one, a milestone's key is its `kind` lowercased (`final_submission`), or the slug of its title for `CUSTOM` and `ROUND`. A prize's key is the slug of its title.
- Two milestones that would get the same key get `_2`, `_3`… **in payload order**. Reordering the list then changes which key belongs to which milestone, which is another reason to send explicit keys.
- A key that doesn't exist yet adds a new milestone or prize.

### 4.6 Dates

- ISO 8601 **with an offset**: `"2026-11-01T23:59:00+05:30"` or `"2026-11-20T12:30:00Z"`. Both are fine.
- `"yyyy-MM-ddTHH:mm"` (or `…:ss`) **without** an offset is read as **IST**.
- **Always include a time.** A bare date like `"2026-11-01"` is read as UTC midnight (05:30 IST), which is almost never what the source meant. For an all-day deadline, use `T23:59` IST.
- Stored in UTC; always shown in IST.

### 4.7 A complete item

```json
{
  "externalId": "trello-6512ab",
  "sourceUrl": "https://example.com/hackathons/zk-buildathon",
  "name": "zkEVM Buildathon",
  "type": "BUILDATHON",
  "mode": "ONLINE",
  "teamSizeMin": 2,
  "teamSizeMax": 4,
  "eligibility": "Open to all",
  "estimatedUsd": 15000,
  "tags": ["web3", "zk"],
  "milestones": [
    { "key": "registration", "kind": "REGISTRATION", "title": "Registration", "startsAt": "2026-10-01T10:00+05:30", "endsAt": "2026-10-14T23:59+05:30" },
    { "key": "build", "kind": "PROTOTYPE", "title": "Build window", "startsAt": "2026-10-15T09:00+05:30", "endsAt": "2026-10-21T09:00+05:30", "requiresAction": false, "isHardDeadline": false },
    { "key": "final_submission", "kind": "FINAL_SUBMISSION", "title": "Final submission", "endsAt": "2026-10-21T09:00+05:30", "action": "Repo + 3 min demo video" },
    { "key": "demo", "kind": "DEMO", "title": "Demo day", "endsAt": "2026-10-23T18:00+05:30", "isHardDeadline": false },
    { "key": "results", "kind": "RESULTS", "title": "Results", "endsAt": "2026-10-26T18:00+05:30", "requiresAction": false, "isHardDeadline": false }
  ],
  "prizes": [
    { "key": "1st", "title": "1st place", "kind": "CASH", "amount": 500000, "currency": "INR", "estimatedUsd": 6000 },
    { "key": "track_zk", "title": "Best zk app", "kind": "CRYPTO", "amount": 2, "currency": "ETH", "estimatedUsd": 5000 }
  ]
}
```

---

## 5. Response: `202 Accepted`

```json
{
  "accepted": 99,
  "rejected": 1,
  "results": [
    { "index": 0, "status": "queued", "eventId": "cmh1…" },
    { "index": 7, "status": "invalid", "eventId": "cmh2…", "issues": [
      { "code": "invalid_value", "path": ["milestones", 2, "kind"], "message": "Invalid option: expected one of \"REGISTRATION\"|…" }
    ] }
  ]
}
```

- `results` has one entry per input item. `index` is the item's position in your `hackathons` array.
- `queued`: stored and waiting for the worker. Keep the `eventId` to check on it.
- `invalid`: rejected with zod `issues`. Each issue's `path` points at the offending field. The item is still stored, as a failed event, and shows under **Review → Failed ingests**. Fix it and send it again.

---

## 6. `GET /api/v1/ingest/:eventId`

The status of one event created **with the same key**. An event created with a different key returns `404`.

```json
{
  "id": "cmh1…",
  "status": "PARTIAL",
  "hackathonId": "cmh0…",
  "result": {
    "created": false,
    "applied": ["estimatedUsd", "milestones.final_submission.endsAt"],
    "added": ["milestones.demo.title", "milestones.demo.endsAt"],
    "conflicted": ["name"]
  },
  "error": null,
  "createdAt": "2026-10-16T10:00:00.000Z",
  "processedAt": "2026-10-16T10:00:02.000Z"
}
```

| `status` | Meaning |
|---|---|
| `QUEUED` | Waiting for the worker. |
| `PROCESSING` | Being written now. |
| `APPLIED` | Created (`result.created: true`), or every changed field was applied. |
| `PARTIAL` | Some fields were applied; others clashed and went to **Review** as conflicts (`result.conflicted`). |
| `NO_CHANGE` | Matched an existing hackathon and nothing differed. Normal for re-sends. |
| `FAILED` | Invalid payload, or the worker gave up after 5 attempts (exponential backoff from 5 s). `error` says why. |

Field paths in `result` look like `name`, `milestones.<key>.<field>` or `prizes.<key>.<field>`.

If an item stays `QUEUED` for a long time, the worker isn't running or can't reach Redis. Queued events are kept and picked up again once it's back.

---

## 7. Matching, updates and conflicts

**Matching.** An existing hackathon is found by `(key's source, externalId)` first, then by normalized `sourceUrl`. No match means a new hackathon.

**Each field is decided separately:**

| Situation | Result |
|---|---|
| New hackathon | Created; every field is marked as coming from this source. |
| Same value as stored | Nothing. |
| Field last set by this source, or never set | Updated. |
| Field last set by a **different source** or **edited by a person** | **Conflict**: the stored value stays until someone picks one in **Review**. |
| A value someone already rejected for this field, sent again by the same source | Ignored. |
| Milestone or prize `key` not seen before | Added. |
| Milestone or prize missing from the payload | Left alone (ingest never deletes). |

So once a person has edited a hackathon in the app, your agent can't silently overwrite those edits.

---

## 8. Auto-archiving on import

After each item is written, the archive rules run. The API can't create teams, so an imported hackathon has none, and:

- If its **registration has already closed**, it's archived right away as **No team registered**. Registration means the `REGISTRATION` milestone or, if there isn't one, the earliest hard action deadline.
- If **every milestone has already ended**, it's archived as **Concluded**.

Past hackathons therefore land in **Archive**, which is usually what you want for history. If a team really did enter one, add the team in the app. A system archive is undone automatically once its reason no longer holds, though a hackathon archived as **Concluded** stays archived. Hackathons whose registration is still open stay active.

---

## 9. `GET /api/v1/hackathons?externalId=…` (or `?sourceUrl=…`)

Checks whether a hackathon already exists. `externalId` lookups only search the key's own source; `sourceUrl` lookups search all sources.

```json
{ "id": "cmh0…", "name": "zkEVM Buildathon", "source": "trello", "externalId": "trello-6512ab", "sourceUrl": "https://…", "archivedAt": null, "updatedAt": "…" }
```

Returns `404` when nothing matches. You don't need this before posting; ingest matches on its own.

---

## 10. Errors

Every error has the same shape:

```json
{ "error": { "code": "validation_failed", "message": "Body must be { hackathons: [...] }", "details": [ … ] } }
```

| Status | `code` | When | What to do |
|---|---|---|---|
| 400 | `validation_failed` | Malformed JSON, or the body isn't `{ hackathons: [1..100 items] }` | Fix the body. Item-level problems don't cause a 400; they come back as `invalid` inside a 202. |
| 401 | `unauthorized` | Missing key, or a key that doesn't exist | Check the header: `Authorization: Bearer trl_…` |
| 403 | `forbidden` | The key was revoked | Create a new key |
| 404 | `not_found` | Unknown event ID (or one from another key), or no hackathon matched a lookup | |
| 405 | – | Wrong HTTP method | |
| 413 | `payload_too_large` | More than 100 items, or a body over 2 MB | Use smaller batches |
| 500 | `internal` | Unexpected server error | Retry the same batch after a short wait |

---

## 11. Bulk client (TypeScript, Bun or Node 18+)

```ts
// TRELLALA_URL=http://localhost:3000 TRELLALA_API_KEY=trl_… bun bulk-ingest.ts data.json
// data.json: an array of hackathon objects shaped as in §4.
import { readFileSync } from "node:fs";

const BASE = process.env.TRELLALA_URL ?? "http://localhost:3000";
const KEY = process.env.TRELLALA_API_KEY;
if (!KEY) throw new Error("Set TRELLALA_API_KEY");
const headers = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const items: unknown[] = JSON.parse(readFileSync(process.argv[2] ?? "data.json", "utf8"));
const BATCH = 100;
const queued: { eventId: string; index: number }[] = [];
const invalid: { index: number; issues: unknown }[] = [];

async function post(batch: unknown[], attempt = 1): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/ingest`, { method: "POST", headers, body: JSON.stringify({ hackathons: batch }) }).catch(() => null);
  if (res && res.status === 202) return res.json();
  if ((!res || res.status >= 500) && attempt < 5) {
    await sleep(1000 * 2 ** attempt);
    return post(batch, attempt + 1);
  }
  throw new Error(`ingest failed: ${res?.status} ${res ? await res.text() : "network error"}`);
}

for (let start = 0; start < items.length; start += BATCH) {
  const body = await post(items.slice(start, start + BATCH));
  for (const r of body.results) {
    const index = start + r.index;
    if (r.status === "queued") queued.push({ eventId: r.eventId, index });
    else invalid.push({ index, issues: r.issues });
  }
  console.log(`batch ${start / BATCH + 1}: ${body.accepted} queued, ${body.rejected} invalid`);
}

// Wait for the worker, then summarize.
const final = new Map<string, any>();
while (final.size < queued.length) {
  for (const q of queued) {
    if (final.has(q.eventId)) continue;
    const ev = await (await fetch(`${BASE}/api/v1/ingest/${q.eventId}`, { headers })).json();
    if (ev.status !== "QUEUED" && ev.status !== "PROCESSING") final.set(q.eventId, { ...ev, index: q.index });
  }
  if (final.size < queued.length) await sleep(2000);
}

const count = (s: string) => [...final.values()].filter((e) => e.status === s).length;
console.log({ total: items.length, invalid: invalid.length, applied: count("APPLIED"), partial: count("PARTIAL"), noChange: count("NO_CHANGE"), failed: count("FAILED") });
for (const i of invalid) console.log("invalid item", i.index, JSON.stringify(i.issues));
for (const e of final.values()) if (e.status === "FAILED" || e.status === "PARTIAL") console.log(e.status, "item", e.index, e.error ?? e.result?.conflicted);
```

---

## 12. Checklist for an importing agent

- [ ] One API key per dataset, and the worker is running.
- [ ] Every hackathon has a stable `externalId` (and `sourceUrl` if you have one).
- [ ] Every milestone and prize has a stable `key`.
- [ ] Windows have `startsAt`; single deadlines don't.
- [ ] Informational dates have `requiresAction: false`; soft deadlines have `isHardDeadline: false`.
- [ ] Every date has a time and an offset (or is written as IST without an offset).
- [ ] `estimatedUsd` is in USD, on the hackathon and on each prize.
- [ ] Enum values are uppercase and from §4.4.
- [ ] Batches of at most 100, sent one after another, under 2 MB each.
- [ ] After sending: every item is `APPLIED` or `NO_CHANGE`, and `invalid`, `FAILED` and `PARTIAL` items have been looked at.
