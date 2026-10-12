import { LIFECYCLE_TEMPLATES } from "@trellala/core/constants";
import type { HackathonDetail, HackathonFormInput, HackathonType } from "@trellala/core/types";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toIstInput } from "./time";

/** register() options for optional numeric inputs: "" → null. */
export const numberInput = { setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)) };

/** register() options for optional text inputs: "" → null. */
export const textInput = { setValueAs: (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v) };

export function templateMilestones(type: HackathonType): HackathonFormInput["milestones"] {
  return LIFECYCLE_TEMPLATES[type].map((t) => ({
    key: t.key,
    kind: t.kind,
    title: t.title,
    action: null,
    startsAt: null,
    endsAt: "",
    sourceTimezone: null,
    requiresAction: t.requiresAction,
    isHardDeadline: t.isHardDeadline,
  }));
}

export function hackathonFormDefaults(h?: HackathonDetail): HackathonFormInput {
  if (!h) {
    return {
      name: "",
      description: null,
      type: "BUILDATHON",
      mode: "ONLINE",
      location: null,
      stage: "DISCOVERED",
      sourceUrl: null,
      teamSizeMin: null,
      teamSizeMax: null,
      eligibility: null,
      estimatedUsd: null,
      effortEstimate: null,
      fitScore: null,
      tags: [],
      notes: null,
      milestones: templateMilestones("BUILDATHON"),
      prizes: [],
    };
  }
  return {
    name: h.name,
    description: h.description,
    type: h.type,
    mode: h.mode,
    location: h.location,
    stage: h.stage,
    sourceUrl: h.sourceUrl,
    teamSizeMin: h.teamSizeMin,
    teamSizeMax: h.teamSizeMax,
    eligibility: h.eligibility,
    estimatedUsd: h.estimatedUsd,
    effortEstimate: h.effortEstimate,
    fitScore: h.fitScore,
    tags: h.tags,
    notes: h.notes,
    milestones: h.milestones.map((m) => ({
      id: m.id,
      key: m.key,
      kind: m.kind,
      title: m.title,
      action: m.action,
      startsAt: m.startsAt ? toIstInput(m.startsAt) : null,
      endsAt: toIstInput(m.endsAt),
      sourceTimezone: m.sourceTimezone,
      requiresAction: m.requiresAction,
      isHardDeadline: m.isHardDeadline,
    })),
    prizes: h.prizes.map((p) => ({
      id: p.id,
      key: p.key,
      title: p.title,
      kind: p.kind,
      amount: p.amount,
      currency: p.currency,
      description: p.description,
      estimatedUsd: p.estimatedUsd,
    })),
  };
}

/** Maps server-side zod field errors onto a react-hook-form instance. */
export function applyFieldErrors<T extends FieldValues>(setError: UseFormSetError<T>, fields: Record<string, string[]>) {
  for (const [name, messages] of Object.entries(fields)) {
    if (messages[0]) setError(name as Path<T>, { type: "server", message: messages[0] });
  }
}
