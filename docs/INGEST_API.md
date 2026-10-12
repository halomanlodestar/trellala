# Ingest API

For scrapers and cron scripts that push hackathons into Trellala. A working example is in [`scripts/ingest-example.ts`](../scripts/ingest-example.ts).

## Auth

Create a key at **/settings/api-keys**. Every key has a **source** label (for example `devfolio`), and everything the key sends is recorded under that source. Send the key as a bearer token:

```
Authorization: Bearer trl_…
```

## `POST /api/v1/ingest`

```json
{
  "hackathons": [
    {
      "externalId": "hack-123",
      "sourceUrl": "https://devfolio.co/hack-123",
      "name": "Hack 123",
      "type": "BUILDATHON",
      "mode": "ONLINE",
      "location": null,
      "teamSizeMin": 2,
      "teamSizeMax": 4,
      "eligibility": "Students",
      "estimatedUsd": 5000,
      "tags": ["ai"],
      "milestones": [
        { "key": "registration", "kind": "REGISTRATION", "title": "Registration", "endsAt": "2026-11-01T23:59:00+05:30" },
        { "kind": "FINAL_SUBMISSION", "title": "Submit", "startsAt": null, "endsAt": "2026-11-20T18:00:00Z", "action": "Repo + video", "requiresAction": true, "isHardDeadline": true }
      ],
      "prizes": [{ "key": "1st", "title": "1st place", "kind": "CASH", "amount": 250000, "currency": "INR", "estimatedUsd": 3000 }]
    }
  ]
}
```

- **Batch size:** 1–100 hackathons. The body can be at most 2 MB.
- **Required:** `name`, plus `externalId` or `sourceUrl` (or both).
- **Matching:** an existing hackathon is found by `(source, externalId)` first, then by normalized `sourceUrl`. URLs that differ only by `www`, a trailing slash or letter case count as the same.
- **Omitted fields are left unchanged.** An explicit `null` clears the value. Ingest never deletes milestones or prizes.
- **Milestone and prize identity:** pass a stable `key` (lowercase letters, digits, `_` or `-`). Without one, the key comes from `kind` (or from `title` when the kind is `CUSTOM` or `ROUND`). Keep keys stable between runs so updates match up.
- **Dates:** use ISO 8601. A timestamp without an offset is read as IST.
- **Enums:**
  - `type`: `BUILDATHON IDEATHON CTF DSA GRANT BOUNTY OTHER`
  - `mode`: `ONLINE OFFLINE HYBRID`
  - `kind` (milestone): `REGISTRATION TEAM_FORMATION IDEA_SUBMISSION SHORTLIST ROUND PROTOTYPE FINAL_SUBMISSION DEMO EVENT_START EVENT_END RESULTS REPORT PAYOUT CUSTOM`
  - `kind` (prize): `CASH CRYPTO NON_MONETARY`

### Response (202)

```json
{
  "accepted": 1,
  "rejected": 1,
  "results": [
    { "index": 0, "status": "queued", "eventId": "…" },
    { "index": 1, "status": "invalid", "eventId": "…", "issues": [ … ] }
  ]
}
```

Valid items are queued and processed by the worker. Invalid items are also stored, as failed events, and appear under **Review → Failed**.

### What happens to each field

| Situation | Result |
|---|---|
| New hackathon | Created |
| Same value as now | Nothing |
| The field was last set by this source, or by nobody | Updated |
| The field was last set by a different source, or edited by a person | **Conflict**: nothing changes until someone resolves it in **Review** |
| A value someone already rejected for this field, sent again by the same source | Ignored |

## `GET /api/v1/ingest/:eventId`

Returns the status of an event created with this key: `QUEUED`, `PROCESSING`, `APPLIED`, `PARTIAL` (some fields went to conflicts), `NO_CHANGE` or `FAILED`. The response includes per-field results.

## `GET /api/v1/hackathons?externalId=…` or `?sourceUrl=…`

Looks up a hackathon. `externalId` lookups only search this key's source.

## Errors

Every error uses the same shape: `{ "error": { "code", "message", "details"? } }`.

| Status | Meaning |
|---|---|
| 400 | Malformed JSON or invalid body |
| 401 | Missing or invalid key |
| 403 | Revoked key |
| 404 | Not found |
| 405 | Wrong method |
| 413 | Batch over 100 items, or body over 2 MB |
| 500 | Unexpected error |
