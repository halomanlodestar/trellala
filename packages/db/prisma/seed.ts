// Sample hackathons for local development: `bun db:seed`.
// Users are created by signing in with Google; this only seeds hackathons.
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(import.meta.dirname, "../../../.env"), quiet: true });

const { prisma } = await import("../src/index");

const day = 864e5;
const at = (days: number, hour = 23, minute = 59) => {
  const d = new Date(Date.now() + days * day);
  d.setUTCHours(hour - 5, minute - 30, 0, 0); // IST → UTC
  return d;
};

const samples = [
  {
    name: "Devfolio AI Buildathon",
    type: "BUILDATHON" as const,
    mode: "ONLINE" as const,
    stage: "COMMITTED" as const,
    tags: ["ai", "web"],
    teamSizeMin: 2,
    teamSizeMax: 4,
    estimatedUsd: 6000,
    fitScore: 4,
    milestones: [
      { key: "registration", kind: "REGISTRATION" as const, title: "Registration", endsAt: at(2) },
      { key: "idea_submission", kind: "IDEA_SUBMISSION" as const, title: "Idea / PPT submission", endsAt: at(2), action: "5-slide PPT + 2 min video" },
      { key: "final_submission", kind: "FINAL_SUBMISSION" as const, title: "Final submission", endsAt: at(12) },
      { key: "results", kind: "RESULTS" as const, title: "Results", endsAt: at(20), requiresAction: false, isHardDeadline: false },
    ],
    prizes: [
      { key: "1st", title: "1st place", kind: "CASH" as const, amount: 300000, currency: "INR", estimatedUsd: 3600 },
      { key: "track_ai", title: "Best AI track", kind: "CRYPTO" as const, amount: 1, currency: "ETH", estimatedUsd: 2400 },
    ],
  },
  {
    name: "InCTF Nationals",
    type: "CTF" as const,
    mode: "OFFLINE" as const,
    location: "Kochi",
    stage: "EVALUATING" as const,
    tags: ["security", "pwn"],
    teamSizeMax: 4,
    estimatedUsd: 2500,
    milestones: [
      { key: "registration", kind: "REGISTRATION" as const, title: "Registration", endsAt: at(6) },
      { key: "event_start", kind: "EVENT_START" as const, title: "CTF starts", endsAt: at(9, 10, 0), requiresAction: false, isHardDeadline: false },
      { key: "event_end", kind: "EVENT_END" as const, title: "CTF ends", endsAt: at(10, 10, 0), requiresAction: false, isHardDeadline: false },
    ],
    prizes: [{ key: "1st", title: "Winner", kind: "CASH" as const, amount: 200000, currency: "INR", estimatedUsd: 2400 }],
  },
  {
    name: "Ecosystem Builder Grant",
    type: "GRANT" as const,
    mode: "ONLINE" as const,
    stage: "DISCOVERED" as const,
    tags: ["web3"],
    estimatedUsd: 25000,
    milestones: [
      { key: "application", kind: "IDEA_SUBMISSION" as const, title: "Proposal", endsAt: at(25) },
      { key: "interview", kind: "DEMO" as const, title: "Interview", endsAt: at(40) },
    ],
    prizes: [{ key: "grant", title: "Grant", kind: "CASH" as const, amount: 25000, currency: "USD", estimatedUsd: 25000 }],
  },
];

for (const { milestones, prizes, ...h } of samples) {
  const existing = await prisma.hackathon.findFirst({ where: { name: h.name } });
  if (existing) continue;
  await prisma.hackathon.create({
    data: {
      ...h,
      milestones: { create: milestones.map((m, i) => ({ ...m, sortOrder: i })) },
      prizes: { create: prizes.map((p, i) => ({ ...p, sortOrder: i })) },
    },
  });
  console.log(`seeded ${h.name}`);
}

await prisma.$disconnect();
