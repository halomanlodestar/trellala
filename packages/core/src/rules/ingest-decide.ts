/** @format */

import { parsePath, valuesEqual } from "../fields";
import type { FieldDecision, FieldSources, FlatValues } from "../types";

export type DecideInput = {
  current: FlatValues;
  incoming: FlatValues;
  fieldSources: FieldSources;
  source: string;
  openConflictPaths: Set<string>;
  milestoneKeys: Set<string>;
  prizeKeys: Set<string>;
};

/**
 * Decides, per incoming field, whether to apply it, add it, leave it, or open a conflict.
 * A clash is a different source (another ingestor or a human edit) owning a field with a different value.
 */
export function decideFields(input: DecideInput): FieldDecision[] {
  const {
    current,
    incoming,
    fieldSources,
    source,
    openConflictPaths,
    milestoneKeys,
    prizeKeys,
  } = input;
  const decisions: FieldDecision[] = [];

  for (const [path, value] of Object.entries(incoming)) {
    const parsed = parsePath(path);
    if (!parsed) continue;

    const isNewEntity =
      (parsed.entity === "milestone" && !milestoneKeys.has(parsed.key)) ||
      (parsed.entity === "prize" && !prizeKeys.has(parsed.key));
    if (isNewEntity) {
      decisions.push({ path, outcome: "added", value });
      continue;
    }

    const currentValue = current[path];
    if (valuesEqual(currentValue, value)) {
      decisions.push({ path, outcome: "unchanged" });
      continue;
    }

    const owner = fieldSources[path];
    if (openConflictPaths.has(path)) {
      decisions.push({
        path,
        outcome: "conflict",
        value,
        currentValue,
        currentSource: owner,
        existingConflict: true,
      });
    } else if (!owner || owner === source) {
      decisions.push({ path, outcome: "applied", value });
    } else {
      decisions.push({
        path,
        outcome: "conflict",
        value,
        currentValue,
        currentSource: owner,
        existingConflict: false,
      });
    }
  }
  return decisions;
}
