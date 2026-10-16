// Dense placeholder data for eyeballing the timeline, queue and lists: `bun db:seed:demo`.
// Everything it creates is marked (hackathon source "demo", users @demo.trellala.local),
// so it never touches real data and can be removed again.
//   bun db:seed:demo            add demo data (skips hackathons already seeded)
//   bun db:seed:demo --fresh    remove demo data, then seed again with dates relative to now
//   bun db:seed:demo --clean    remove demo data only
import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(import.meta.dirname, "../../../.env"), quiet: true });

const { prisma } = await import("../src/index");

const SOURCE = "demo";
const EMAIL_DOMAIN = "demo.trellala.local";
const args = new Set(process.argv.slice(2));

// ── IST-relative dates ─────────────────────────────────────────
const IST_MS = 330 * 60_000;
const istToday = new Date(Date.now() + IST_MS);
/** `days` from today (IST) at hh:mm IST. */
const at = (days: number, hour = 23, minute = 59) =>
  new Date(Date.UTC(istToday.getUTCFullYear(), istToday.getUTCMonth(), istToday.getUTCDate() + days, hour, minute) - IST_MS);

type Kind =
  | "REGISTRATION" | "TEAM_FORMATION" | "IDEA_SUBMISSION" | "SHORTLIST" | "ROUND" | "PROTOTYPE"
  | "FINAL_SUBMISSION" | "DEMO" | "EVENT_START" | "EVENT_END" | "RESULTS" | "REPORT" | "PAYOUT" | "CUSTOM";
type M = { key: string; kind: Kind; title: string; startsAt?: Date; endsAt: Date; action?: string; requiresAction?: boolean; isHardDeadline?: boolean };
type T = { name: string; idea?: string; members: string[]; status?: "ACTIVE" | "MISSED"; done?: string[]; missed?: string[]; own?: M[] };
type H = {
  slug: string; name: string; type: "BUILDATHON" | "IDEATHON" | "CTF" | "DSA" | "GRANT" | "BOUNTY" | "OTHER";
  mode: "ONLINE" | "OFFLINE" | "HYBRID"; location?: string; stage: "DISCOVERED" | "EVALUATING" | "COMMITTED";
  usd?: number; tags: string[]; teamSizeMin?: number; teamSizeMax?: number; milestones: M[]; teams?: T[];
};

const info = { requiresAction: false, isHardDeadline: false } as const;
const soft = { isHardDeadline: false } as const;

const PEOPLE = [
  { key: "ritu", name: "Ritu Sharma", skills: ["dsa", "backend"] },
  { key: "aman", name: "Aman Verma", skills: ["frontend", "design"] },
  { key: "sana", name: "Sana Iqbal", skills: ["ml", "python"] },
  { key: "dev", name: "Dev Patel", skills: ["solidity", "rust"] },
  { key: "meera", name: "Meera Nair", skills: ["security", "pwn"] },
  { key: "kabir", name: "Kabir Singh", skills: ["pitching", "product"] },
];

const HACKATHONS: H[] = [
  {
    slug: "zkevm-buildathon", name: "zkEVM Buildathon", type: "BUILDATHON", mode: "ONLINE", stage: "COMMITTED", usd: 15000, tags: ["web3", "zk"], teamSizeMin: 2, teamSizeMax: 4,
    milestones: [
      { key: "registration", kind: "REGISTRATION", title: "Registration", startsAt: at(-18, 10, 0), endsAt: at(-2) },
      { key: "team_formation", kind: "TEAM_FORMATION", title: "Team lock", endsAt: at(-1, 18, 0), ...soft },
      { key: "build", kind: "PROTOTYPE", title: "Build window", startsAt: at(-1, 9, 0), endsAt: at(5, 9, 0), ...info },
      { key: "final_submission", kind: "FINAL_SUBMISSION", title: "Final submission", endsAt: at(5, 9, 0), action: "Repo + 3 min demo video" },
      { key: "demo", kind: "DEMO", title: "Demo day", endsAt: at(7, 18, 0), ...soft },
      { key: "results", kind: "RESULTS", title: "Results", endsAt: at(10, 18, 0), ...info },
    ],
    teams: [
      { name: "Null Pointers", idea: "zk proof-of-attendance badges", members: ["dev", "aman"], done: ["registration", "team_formation"], own: [{ key: "internal_demo", kind: "CUSTOM", title: "Internal demo", endsAt: at(3, 20, 0), ...soft }] },
      { name: "Byte Me", idea: "Private payroll on L2", members: ["ritu", "kabir"], done: ["registration"] },
    ],
  },
  {
    slug: "sih-2026", name: "Smart India Hackathon 2026", type: "IDEATHON", mode: "HYBRID", stage: "COMMITTED", usd: 1200, tags: ["govtech"], teamSizeMin: 6, teamSizeMax: 6,
    milestones: [
      { key: "idea_submission", kind: "IDEA_SUBMISSION", title: "Idea submission", startsAt: at(-12, 10, 0), endsAt: at(1, 17, 0), action: "PPT on the portal" },
      { key: "shortlist", kind: "SHORTLIST", title: "Shortlist", endsAt: at(9, 12, 0), ...info },
      { key: "finale", kind: "EVENT_START", title: "Grand finale", startsAt: at(30, 9, 0), endsAt: at(31, 18, 0) },
    ],
    teams: [{ name: "Kernel Panic", idea: "Crop disease triage over WhatsApp", members: ["sana", "meera"] }],
  },
  {
    slug: "hackmit-online", name: "HackMIT Online", type: "BUILDATHON", mode: "ONLINE", stage: "COMMITTED", usd: 12000, tags: ["ai", "web"], teamSizeMax: 4,
    milestones: [
      { key: "registration", kind: "REGISTRATION", title: "Registration", startsAt: at(-14, 9, 0), endsAt: at(-1, 23, 59) },
      { key: "build", kind: "PROTOTYPE", title: "Build window", startsAt: at(-1, 21, 0), endsAt: at(2, 21, 0), ...info },
      { key: "final_submission", kind: "FINAL_SUBMISSION", title: "Submission", endsAt: at(2, 21, 0) },
      { key: "demo", kind: "DEMO", title: "Demo day", endsAt: at(3, 19, 30), ...soft },
    ],
    teams: [
      { name: "Gamma", idea: "Lecture-to-flashcards agent", members: ["sana"], done: ["registration"] },
      { name: "Delta", members: ["aman"], status: "MISSED", missed: ["registration"] },
    ],
  },
  {
    slug: "devpost-agents", name: "AI Agents Challenge", type: "BUILDATHON", mode: "ONLINE", stage: "COMMITTED", usd: 20000, tags: ["ai", "agents"],
    milestones: [
      { key: "final_submission", kind: "FINAL_SUBMISSION", title: "Submissions close", startsAt: at(-20, 10, 0), endsAt: at(0, 23, 30) },
      { key: "judging", kind: "ROUND", title: "Judging", startsAt: at(1, 0, 0), endsAt: at(14, 18, 0), ...info },
      { key: "results", kind: "RESULTS", title: "Winners", endsAt: at(16, 18, 0), ...info },
    ],
    teams: [{ name: "Prompt Injection", idea: "Calendar-negotiating agent", members: ["kabir", "dev"] }],
  },
  {
    slug: "codesprint", name: "CodeSprint", type: "DSA", mode: "ONLINE", stage: "EVALUATING", tags: ["dsa"],
    milestones: [
      { key: "round_1", kind: "ROUND", title: "Round A", startsAt: at(4, 20, 0), endsAt: at(4, 23, 0) },
      { key: "round_2", kind: "ROUND", title: "Round B", startsAt: at(18, 20, 0), endsAt: at(18, 23, 0) },
      { key: "finals", kind: "ROUND", title: "Finals", startsAt: at(32, 18, 0), endsAt: at(32, 22, 0) },
    ],
    teams: [
      { name: "Ritu (solo)", members: ["ritu"] },
      { name: "Meera (solo)", members: ["meera"] },
    ],
  },
  {
    slug: "climate-ideathon", name: "Climate Action Ideathon", type: "IDEATHON", mode: "ONLINE", stage: "DISCOVERED", usd: 600, tags: ["climate"],
    milestones: [
      { key: "registration", kind: "REGISTRATION", title: "Registration", startsAt: at(-6, 10, 0), endsAt: at(6) },
      { key: "idea_submission", kind: "IDEA_SUBMISSION", title: "Pitch deck", endsAt: at(14) },
      { key: "results", kind: "RESULTS", title: "Results", endsAt: at(22, 18, 0), ...info },
    ],
  },
  {
    slug: "picoctf-2026", name: "picoCTF 2026", type: "CTF", mode: "ONLINE", stage: "COMMITTED", usd: 5000, tags: ["security"], teamSizeMax: 5,
    milestones: [
      { key: "registration", kind: "REGISTRATION", title: "Sign-up closes", endsAt: at(8) },
      { key: "competition", kind: "EVENT_START", title: "Competition", startsAt: at(9, 22, 0), endsAt: at(19, 22, 0), ...info },
      { key: "report", kind: "REPORT", title: "Write-ups", endsAt: at(21) },
    ],
    teams: [{ name: "Root Beer", members: ["meera", "ritu", "dev"], done: ["registration"] }],
  },
  {
    slug: "inctf-nationals", name: "InCTF Nationals", type: "CTF", mode: "OFFLINE", location: "Kochi", stage: "EVALUATING", usd: 2500, tags: ["security", "pwn"], teamSizeMax: 4,
    milestones: [
      { key: "registration", kind: "REGISTRATION", title: "Registration", endsAt: at(6) },
      { key: "event", kind: "EVENT_START", title: "CTF (24 h)", startsAt: at(9, 10, 0), endsAt: at(10, 10, 0), ...info },
      { key: "report", kind: "REPORT", title: "Travel claims", endsAt: at(12), ...soft },
    ],
  },
  {
    slug: "radar-grant", name: "Ecosystem Radar Grant", type: "GRANT", mode: "ONLINE", stage: "EVALUATING", usd: 25000, tags: ["web3"],
    milestones: [
      { key: "application", kind: "IDEA_SUBMISSION", title: "Application", startsAt: at(-5, 10, 0), endsAt: at(12) },
      { key: "review", kind: "ROUND", title: "Review", startsAt: at(13, 0, 0), endsAt: at(26, 23, 0), ...info },
      { key: "interview", kind: "DEMO", title: "Interview", endsAt: at(20, 16, 0), ...soft },
      { key: "decision", kind: "RESULTS", title: "Decision", endsAt: at(28, 12, 0), ...info },
    ],
    teams: [{ name: "Dev (solo)", members: ["dev"] }],
  },
  {
    slug: "wallet-ux-bounty", name: "Wallet UX Bounty", type: "BOUNTY", mode: "ONLINE", stage: "DISCOVERED", usd: 3000, tags: ["web3", "design"],
    milestones: [{ key: "final_submission", kind: "FINAL_SUBMISSION", title: "Bounty window", startsAt: at(-2, 12, 0), endsAt: at(16) }],
  },
  {
    slug: "solution-challenge", name: "Solution Challenge", type: "BUILDATHON", mode: "ONLINE", stage: "COMMITTED", usd: 10000, tags: ["social-good", "mobile"], teamSizeMin: 2, teamSizeMax: 4,
    milestones: [
      { key: "registration", kind: "REGISTRATION", title: "Registration", startsAt: at(-30, 10, 0), endsAt: at(20) },
      { key: "prototype", kind: "PROTOTYPE", title: "Prototype phase", startsAt: at(20, 0, 0), endsAt: at(55, 23, 0), ...info },
      { key: "final_submission", kind: "FINAL_SUBMISSION", title: "Submission", endsAt: at(55) },
      { key: "shortlist", kind: "SHORTLIST", title: "Top 100", endsAt: at(70, 12, 0), ...info },
      { key: "demo", kind: "DEMO", title: "Demo day", endsAt: at(85, 18, 0), ...soft },
    ],
    teams: [{ name: "Pixel Pushers", idea: "Offline-first clinic queue", members: ["aman", "kabir"] }],
  },
  {
    slug: "grid-7", name: "GRiD 7.0", type: "BUILDATHON", mode: "ONLINE", stage: "COMMITTED", usd: 8000, tags: ["ecommerce", "ml"], teamSizeMax: 3,
    milestones: [
      { key: "round_1", kind: "ROUND", title: "Round 1 quiz", startsAt: at(3, 20, 0), endsAt: at(3, 21, 0) },
      { key: "prototype", kind: "PROTOTYPE", title: "Round 2 build", startsAt: at(10, 10, 0), endsAt: at(24, 23, 0), ...info },
      { key: "final_submission", kind: "FINAL_SUBMISSION", title: "Prototype due", endsAt: at(24) },
      { key: "finale", kind: "EVENT_START", title: "Finale", endsAt: at(40, 10, 0), ...soft },
    ],
    teams: [
      { name: "Alpha", members: ["ritu", "sana"] },
      { name: "Beta", members: ["meera", "aman"] },
    ],
  },
  {
    slug: "ethglobal-online", name: "ETHGlobal Online", type: "BUILDATHON", mode: "ONLINE", stage: "EVALUATING", usd: 50000, tags: ["web3"], teamSizeMax: 5,
    milestones: [
      { key: "team_formation", kind: "TEAM_FORMATION", title: "Team formation", endsAt: at(24, 20, 0), ...soft },
      { key: "hacking", kind: "PROTOTYPE", title: "Hacking", startsAt: at(26, 9, 0), endsAt: at(47, 9, 0), ...info },
      { key: "checkpoint", kind: "CUSTOM", title: "Checkpoint", endsAt: at(36, 20, 0), ...soft },
      { key: "final_submission", kind: "FINAL_SUBMISSION", title: "Final submission", endsAt: at(47, 9, 0) },
      { key: "results", kind: "RESULTS", title: "Finalists", endsAt: at(50, 18, 0), ...info },
    ],
    teams: [{ name: "Gas Guzzlers", members: ["dev", "kabir", "sana"] }],
  },
  {
    slug: "kaggle-playground", name: "Kaggle Playground S6", type: "OTHER", mode: "ONLINE", stage: "DISCOVERED", tags: ["ml"],
    milestones: [
      { key: "competition", kind: "EVENT_START", title: "Competition", startsAt: at(-40, 5, 30), endsAt: at(60, 5, 29), ...info },
      { key: "final_submission", kind: "FINAL_SUBMISSION", title: "Final submission", endsAt: at(60, 5, 29) },
    ],
    teams: [{ name: "Overfit", members: ["sana"] }],
  },
];

async function clean() {
  const { count } = await prisma.hackathon.deleteMany({ where: { source: SOURCE } });
  const users = await prisma.user.deleteMany({ where: { email: { endsWith: `@${EMAIL_DOMAIN}` } } });
  console.log(`removed ${count} demo hackathons, ${users.count} demo users`);
}

async function seed() {
  const users = new Map<string, string>();
  for (const p of PEOPLE) {
    const email = `${p.key}@${EMAIL_DOMAIN}`;
    const u = await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: p.name, skills: p.skills } });
    users.set(p.key, u.id);
  }
  const userId = (key: string) => {
    const id = users.get(key);
    if (!id) throw new Error(`unknown demo person "${key}"`);
    return id;
  };

  for (const h of HACKATHONS) {
    if (await prisma.hackathon.findFirst({ where: { source: SOURCE, externalId: h.slug } })) continue;
    await prisma.$transaction(async (tx) => {
      const hackathon = await tx.hackathon.create({
        data: {
          name: h.name, type: h.type, mode: h.mode, location: h.location, stage: h.stage,
          source: SOURCE, externalId: h.slug, estimatedUsd: h.usd, tags: [...h.tags, "demo"],
          teamSizeMin: h.teamSizeMin, teamSizeMax: h.teamSizeMax,
          milestones: { create: h.milestones.map((m, i) => ({ ...m, sortOrder: i })) },
        },
        include: { milestones: true },
      });
      const byKey = new Map(hackathon.milestones.map((m) => [m.key, m.id]));
      for (const t of h.teams ?? []) {
        const team = await tx.team.create({
          data: {
            hackathonId: hackathon.id, name: t.name, ideaTitle: t.idea, status: t.status ?? "ACTIVE",
            members: { create: t.members.map((k) => ({ userId: userId(k), hackathonId: hackathon.id })) },
            milestones: { create: (t.own ?? []).map((m, i) => ({ ...m, hackathonId: hackathon.id, sortOrder: i })) },
          },
        });
        const progress = [
          ...(t.done ?? []).map((k) => ({ key: k, state: "DONE" as const })),
          ...(t.missed ?? []).map((k) => ({ key: k, state: "MISSED" as const })),
        ];
        for (const p of progress) {
          const milestoneId = byKey.get(p.key);
          if (!milestoneId) throw new Error(`${h.slug}: no milestone "${p.key}"`);
          await tx.teamMilestone.create({ data: { teamId: team.id, milestoneId, state: p.state, completedAt: p.state === "DONE" ? new Date() : null } });
        }
      }
    });
    console.log(`seeded ${h.name}`);
  }
}

if (args.has("--clean") || args.has("--fresh")) await clean();
if (!args.has("--clean")) await seed();
await prisma.$disconnect();
