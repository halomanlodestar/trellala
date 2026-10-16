import "server-only";
import * as core from "@trellala/core";
import { buildTimelineLanes } from "@trellala/core/rules";
import type { ArchiveReason, HackathonListFilter } from "@trellala/core/types";
import { notFound } from "next/navigation";
import { requireUser } from "../auth";

export async function loadHackathons(filter: HackathonListFilter) {
  await requireUser();
  return core.listHackathons(filter);
}

export async function loadArchived(reason?: ArchiveReason) {
  await requireUser();
  return core.listArchived(reason);
}

export async function loadHackathon(id: string) {
  await requireUser();
  const h = await core.getHackathonDetail(id);
  if (!h) notFound();
  return h;
}

export async function loadTeam(teamId: string) {
  await requireUser();
  const t = await core.getTeamDetail(teamId);
  if (!t) notFound();
  return t;
}

export async function loadTimeline(now: Date) {
  await requireUser();
  const rows = await core.getTimeline();
  return { rows, lanes: buildTimelineLanes(rows, now) };
}

export async function loadHackathonSources(id: string) {
  await requireUser();
  return core.listIngestEventsForHackathon(id);
}
