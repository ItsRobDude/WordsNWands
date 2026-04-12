import type { RuntimeValidationSnapshot } from "../../../validation/src/contracts/types.js";

import type { RuntimeCreatureDefinition } from "./contracts/encounter.js";
import type { RuntimeEncounterDefinition } from "./contracts/encounter.js";
import type { RuntimeContentPackageManifest } from "./contracts/manifest.js";
import type { RuntimeProgressionDefinition } from "./contracts/progression.js";

export interface RuntimeEncounterPayload {
  id: string;
  contentVersion: string;
  creature: RuntimeCreatureDefinition;
  encounter: RuntimeEncounterDefinition;
}

export interface BundledContentRuntime {
  manifest: RuntimeContentPackageManifest;
  progression: RuntimeProgressionDefinition;
  validation_snapshot: RuntimeValidationSnapshot;
  encounters_by_id: Readonly<Record<string, RuntimeEncounterPayload>>;
}

export interface CreateBundledContentRuntimeInput {
  manifest: RuntimeContentPackageManifest;
  progression: RuntimeProgressionDefinition;
  validation_snapshot: RuntimeValidationSnapshot;
  encounters: readonly RuntimeEncounterPayload[];
}

export const createBundledContentRuntime = (
  input: CreateBundledContentRuntimeInput,
): BundledContentRuntime => {
  const encounters_by_id = Object.fromEntries(
    input.encounters.map((encounter) => [encounter.id, encounter]),
  );

  ensure(
    input.progression.progression_version ===
      input.manifest.progression_version,
    "Bundled progression version must match manifest.progression_version.",
  );
  ensure(
    input.validation_snapshot.metadata.snapshot_version ===
      input.manifest.validation_snapshot_version,
    "Bundled validation snapshot version must match manifest.validation_snapshot_version.",
  );

  const encounterIds = new Set<string>();
  for (const encounter of input.encounters) {
    ensure(
      encounter.contentVersion === input.manifest.content_version,
      `Encounter payload ${encounter.id} must match manifest.content_version.`,
    );
    ensure(
      encounter.encounter.contentVersion === input.manifest.content_version,
      `Encounter definition ${encounter.id} must match manifest.content_version.`,
    );
    ensure(
      encounter.creature.contentVersion === input.manifest.content_version,
      `Creature definition ${encounter.id} must match manifest.content_version.`,
    );
    ensure(
      !encounterIds.has(encounter.id),
      `Encounter payload ids must be unique. Duplicate id: ${encounter.id}`,
    );
    encounterIds.add(encounter.id);
  }

  ensure(
    encounterIds.has(input.progression.starter_encounter_id),
    `Starter encounter ${input.progression.starter_encounter_id} must exist in bundled encounters.`,
  );

  for (const chapter of input.progression.chapters) {
    for (const encounter_id of chapter.encounter_ids) {
      ensure(
        encounterIds.has(encounter_id),
        `Progression chapter ${chapter.chapter_id} references missing encounter ${encounter_id}.`,
      );
    }
  }

  return {
    manifest: input.manifest,
    progression: input.progression,
    validation_snapshot: input.validation_snapshot,
    encounters_by_id,
  };
};

const ensure = (condition: unknown, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
};
