import manifestJson from "../../../../content/packages/content_m2_launch_v1/manifest.json";
import starterEncounterJson from "../../../../content/packages/content_m2_launch_v1/encounters/enc_starter_001.json";
import meadowEncounterJson from "../../../../content/packages/content_m2_launch_v1/encounters/enc_meadow_001.json";
import progressionJson from "../../../../content/packages/content_m2_launch_v1/progression/progression.progression_m2_chapter_linear_v1.json";
import validationSnapshotJson from "../../../../content/packages/content_m2_launch_v1/validation/snapshot.val_snapshot_m2_launch_v1.json";

import type { RuntimeEncounterDefinition } from "../../../../packages/content/src/runtime/contracts/encounter.ts";
import type { RuntimeContentPackageManifest } from "../../../../packages/content/src/runtime/contracts/manifest.ts";
import type { RuntimeProgressionDefinition } from "../../../../packages/content/src/runtime/contracts/progression.ts";

export interface RuntimeEncounterPayload {
  id: string;
  contentVersion: string;
  creature: import("../../../../packages/content/src/runtime/contracts/encounter.ts").RuntimeCreatureDefinition;
  encounter: RuntimeEncounterDefinition;
}

export interface RuntimeValidationSnapshot {
  metadata: {
    snapshot_version: string;
    language: "en";
    word_count: number;
    tagged_word_count: number;
    generated_at_utc: string;
  };
  castable_words: string[];
  element_tags: Partial<
    Record<string, "flame" | "tide" | "bloom" | "storm" | "stone" | "light">
  >;
}

export interface BundledPhaseOneContent {
  manifest: RuntimeContentPackageManifest;
  progression: RuntimeProgressionDefinition;
  validation_snapshot: RuntimeValidationSnapshot;
  encounters_by_id: Readonly<Record<string, RuntimeEncounterPayload>>;
}

const BUNDLED_PHASE_ONE_CONTENT: BundledPhaseOneContent = {
  manifest: manifestJson as RuntimeContentPackageManifest,
  progression: progressionJson as RuntimeProgressionDefinition,
  validation_snapshot: validationSnapshotJson as RuntimeValidationSnapshot,
  encounters_by_id: {
    enc_starter_001: starterEncounterJson as RuntimeEncounterPayload,
    enc_meadow_001: meadowEncounterJson as RuntimeEncounterPayload,
  },
};

export const getBundledPhaseOneContent = (): BundledPhaseOneContent =>
  BUNDLED_PHASE_ONE_CONTENT;
