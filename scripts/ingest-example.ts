// Example ingestor: pushes one hackathon to the API.
//   TRELLALA_URL=http://localhost:3000 TRELLALA_API_KEY=trl_... bun scripts/ingest-example.ts
const url = process.env.TRELLALA_URL ?? "http://localhost:3000";
const key = process.env.TRELLALA_API_KEY;
if (!key) throw new Error("Set TRELLALA_API_KEY (create one at /settings/api-keys)");

const res = await fetch(`${url}/api/v1/ingest`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    hackathons: [
      {
        externalId: "example-hack-2026",
        sourceUrl: "https://example.com/hackathons/example-hack-2026",
        name: "Example Hack 2026",
        type: "BUILDATHON",
        mode: "HYBRID",
        location: "Bengaluru",
        teamSizeMin: 2,
        teamSizeMax: 4,
        tags: ["ai"],
        estimatedUsd: 5000,
        milestones: [
          { kind: "REGISTRATION", title: "Registration", endsAt: "2026-11-01T23:59:00+05:30" },
          { kind: "IDEA_SUBMISSION", title: "Idea submission", endsAt: "2026-11-01T23:59:00+05:30", action: "PPT upload" },
          { kind: "FINAL_SUBMISSION", title: "Final submission", endsAt: "2026-11-20T18:00:00+05:30" },
        ],
        prizes: [{ title: "1st place", kind: "CASH", amount: 250000, currency: "INR", estimatedUsd: 3000 }],
      },
    ],
  }),
});

console.log(res.status, JSON.stringify(await res.json(), null, 2));
