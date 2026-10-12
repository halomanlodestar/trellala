import { describe, expect, test } from "bun:test";
import { flatten } from "../src/fields";
import { decideArchive, type ArchiveSnapshot } from "../src/rules/archive";
import { decideFields } from "../src/rules/ingest-decide";
import { priorityScore } from "../src/rules/ranking";
import { dateSchema } from "../src/schemas";

const now = new Date("2026-10-12T12:00:00Z");
const past = new Date("2026-10-10T12:00:00Z");
const future = new Date("2026-10-20T12:00:00Z");
const longAgo = new Date("2026-09-01T00:00:00Z");

describe("decideFields", () => {
  const base = {
    current: flatten({ name: "A", milestones: [{ key: "final", endsAt: past, title: "Final" }] }),
    openConflictPaths: new Set<string>(),
    milestoneKeys: new Set(["final"]),
    prizeKeys: new Set<string>(),
  };

  test("same source updates apply", () => {
    const d = decideFields({ ...base, incoming: { name: "B" }, fieldSources: { name: "ingest:x" }, source: "ingest:x" });
    expect(d).toEqual([{ path: "name", outcome: "applied", value: "B" }]);
  });

  test("human-edited field clashes with ingest", () => {
    const d = decideFields({ ...base, incoming: { name: "B" }, fieldSources: { name: "user:1" }, source: "ingest:x" });
    expect(d[0]?.outcome).toBe("conflict");
  });

  test("identical value is unchanged even across sources", () => {
    const d = decideFields({ ...base, incoming: { name: "A" }, fieldSources: { name: "user:1" }, source: "ingest:x" });
    expect(d[0]?.outcome).toBe("unchanged");
  });

  test("open conflict collects another candidate", () => {
    const d = decideFields({ ...base, incoming: { name: "C" }, fieldSources: { name: "ingest:x" }, source: "ingest:x", openConflictPaths: new Set(["name"]) });
    expect(d[0]).toMatchObject({ outcome: "conflict", existingConflict: true });
  });

  test("new milestone key is added", () => {
    const d = decideFields({ ...base, incoming: { "milestones.demo.title": "Demo" }, fieldSources: {}, source: "ingest:x" });
    expect(d[0]?.outcome).toBe("added");
  });

  test("tag order doesn't matter", () => {
    expect(flatten({ tags: ["b", "a"] })).toEqual(flatten({ tags: ["a", "b"] }));
  });
});

describe("decideArchive", () => {
  const hard = { id: "m1", kind: "FINAL_SUBMISSION" as const, endsAt: past, requiresAction: true, isHardDeadline: true };
  const snap = (over: Partial<ArchiveSnapshot>): ArchiveSnapshot => ({ archivedAt: null, archiveReason: null, archivedById: null, eventMilestones: [hard], teams: [], ...over });

  test("one team misses, the other is done: team red, not archived", () => {
    const d = decideArchive(
      snap({
        eventMilestones: [hard, { ...hard, id: "m2", endsAt: future }],
        teams: [
          { id: "t1", status: "ACTIVE", createdAt: longAgo, progress: [] },
          { id: "t2", status: "ACTIVE", createdAt: longAgo, progress: [{ milestoneId: "m1", state: "DONE" }] },
        ],
      }),
      now,
    );
    expect(d.teamsToMissed).toEqual(["t1"]);
    expect(d.archive).toBeNull();
  });

  test("both teams miss → ALL_TEAMS_OUT", () => {
    const team = (id: string) => ({ id, status: "ACTIVE" as const, createdAt: longAgo, progress: [] });
    const d = decideArchive(snap({ eventMilestones: [hard, { ...hard, id: "m2", endsAt: future }], teams: [team("t1"), team("t2")] }), now);
    expect(d.archive).toBe("ALL_TEAMS_OUT");
  });

  test("registration closed with no teams → NO_TEAM_REGISTERED", () => {
    const d = decideArchive(snap({ eventMilestones: [{ ...hard, kind: "REGISTRATION" }, { ...hard, id: "m2", endsAt: future }] }), now);
    expect(d.archive).toBe("NO_TEAM_REGISTERED");
  });

  test("deadlines before team creation don't count", () => {
    const d = decideArchive(snap({ eventMilestones: [hard, { ...hard, id: "m2", endsAt: future }], teams: [{ id: "t1", status: "ACTIVE", createdAt: now, progress: [] }] }), now);
    expect(d.teamsToMissed).toEqual([]);
  });

  test("extended deadline reverts MISSED and unarchives system archive", () => {
    const d = decideArchive(
      snap({
        archivedAt: past,
        archiveReason: "ALL_TEAMS_OUT",
        eventMilestones: [{ ...hard, endsAt: future }],
        teams: [{ id: "t1", status: "MISSED", createdAt: longAgo, progress: [{ milestoneId: "m1", state: "MISSED" }] }],
      }),
      now,
    );
    expect(d.revertMissed).toHaveLength(1);
    expect(d.teamsToActive).toEqual(["t1"]);
    expect(d.unarchive).toBe(true);
  });

  test("manual archive is never undone", () => {
    const d = decideArchive(snap({ archivedAt: past, archiveReason: "LOW_PRIZE", archivedById: "u1", eventMilestones: [{ ...hard, endsAt: future }] }), now);
    expect(d.unarchive).toBe(false);
    expect(d.archive).toBeNull();
  });
});

describe("misc", () => {
  test("naive datetime is read as IST", () => {
    expect(dateSchema.parse("2026-10-20T18:00").toISOString()).toBe("2026-10-20T12:30:00.000Z");
  });

  test("closer deadline ranks higher", () => {
    const action = (endsAt: Date) => ({ milestoneId: "m", title: "", kind: "CUSTOM" as const, action: null, endsAt, isHardDeadline: true, teamId: null, teamOnly: false, overdue: false });
    const soon = priorityScore({ nextAction: action(new Date(now.getTime() + 6 * 36e5)), estimatedUsd: 1000, fitScore: 3, effortEstimate: null, now });
    const later = priorityScore({ nextAction: action(future), estimatedUsd: 1000, fitScore: 3, effortEstimate: null, now });
    expect(soon).toBeGreaterThan(later);
  });
});
