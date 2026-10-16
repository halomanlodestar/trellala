import { describe, expect, test } from "bun:test";
import { buildTimelineLanes, markKind, teamMarkState } from "../src/rules/timeline";
import type { MilestoneView, TimelineRow } from "../src/types";

const now = new Date("2026-10-12T12:00:00Z");
const past = new Date("2026-10-10T12:00:00Z");
const soon = new Date("2026-10-14T12:00:00Z");
const later = new Date("2026-10-20T12:00:00Z");

const ms = (id: string, over: Partial<MilestoneView> = {}): MilestoneView => ({
  id,
  key: id,
  kind: "FINAL_SUBMISSION",
  title: id,
  action: null,
  startsAt: null,
  endsAt: later,
  sourceTimezone: null,
  requiresAction: true,
  isHardDeadline: true,
  teamId: null,
  ...over,
});

const row = (over: Partial<TimelineRow> = {}): TimelineRow => ({
  hackathonId: "h",
  name: "H",
  type: "BUILDATHON",
  mode: "ONLINE",
  estimatedUsd: null,
  milestones: [],
  teams: [],
  ...over,
});

describe("teamMarkState", () => {
  test.each([
    ["DONE", later, true, "done"],
    ["SKIPPED", past, true, "skipped"],
    ["MISSED", later, true, "missed"],
    ["TODO", later, true, "todo"],
    [undefined, later, false, "todo"],
    ["TODO", past, true, "missed"],
    [undefined, past, false, "late"],
  ] as const)("%s, ends %s, hard=%s → %s", (state, endsAt, isHardDeadline, expected) => {
    expect(teamMarkState(state, { endsAt, isHardDeadline }, now)).toBe(expected);
  });
});

describe("markKind", () => {
  test("hard action, soft action, info", () => {
    expect(markKind({ requiresAction: true, isHardDeadline: true })).toBe("hard");
    expect(markKind({ requiresAction: true, isHardDeadline: false })).toBe("action");
    expect(markKind({ requiresAction: false, isHardDeadline: true })).toBe("info");
  });
});

describe("buildTimelineLanes", () => {
  test("phases become spans; only action phases also get a deadline mark", () => {
    const [lane] = buildTimelineLanes(
      [
        row({
          milestones: [
            ms("build", { startsAt: past, endsAt: soon, requiresAction: false, isHardDeadline: false }),
            ms("reg", { startsAt: past, endsAt: soon }),
            ms("results", { endsAt: later, requiresAction: false, isHardDeadline: false }),
          ],
        }),
      ],
      now,
    );
    expect(lane?.phases.map((p) => p.milestoneId)).toEqual(["build", "reg"]);
    expect(lane?.marks.map((m) => [m.milestoneId, m.kind])).toEqual([
      ["reg", "hard"],
      ["results", "info"],
    ]);
  });

  test("team marks cover event actions and the team's own milestones, in date order", () => {
    const [lane] = buildTimelineLanes(
      [
        row({
          milestones: [ms("reg", { endsAt: past }), ms("sub", { endsAt: later }), ms("info", { requiresAction: false })],
          teams: [
            {
              id: "t",
              name: "Alpha",
              status: "ACTIVE",
              milestones: [ms("demo", { endsAt: soon, teamId: "t", isHardDeadline: false })],
              progress: [{ milestoneId: "reg", state: "DONE", proofUrl: null, note: null, completedAt: past }],
            },
          ],
        }),
      ],
      now,
    );
    const team = lane?.teams[0];
    expect(team?.marks.map((m) => [m.milestoneId, m.state, m.teamOnly])).toEqual([
      ["reg", "done", false],
      ["demo", "todo", true],
      ["sub", "todo", false],
    ]);
    expect(team).toMatchObject({ done: 1, total: 3, missed: false });
  });

  test("a passed hard deadline left TODO marks the team as missed", () => {
    const [lane] = buildTimelineLanes(
      [row({ milestones: [ms("reg", { endsAt: past })], teams: [{ id: "t", name: "Delta", status: "ACTIVE", milestones: [], progress: [] }] })],
      now,
    );
    expect(lane?.teams[0]?.missed).toBe(true);
  });

  test("lanes sort by next action; lanes with nothing ahead go last", () => {
    const lanes = buildTimelineLanes(
      [
        row({ hackathonId: "done", milestones: [ms("x", { endsAt: past })] }),
        row({ hackathonId: "later", milestones: [ms("x", { endsAt: later })] }),
        row({ hackathonId: "soon", milestones: [ms("x", { endsAt: soon })] }),
      ],
      now,
    );
    expect(lanes.map((l) => l.hackathonId)).toEqual(["soon", "later", "done"]);
  });
});
