import manifestJson from "../../../../content/packages/content_m2_launch_v1/manifest.json";
import starterEncounterJson from "../../../../content/packages/content_m2_launch_v1/encounters/enc_starter_001.json";
import meadowEncounterJson from "../../../../content/packages/content_m2_launch_v1/encounters/enc_meadow_001.json";
import progressionJson from "../../../../content/packages/content_m2_launch_v1/progression/progression.progression_m2_chapter_linear_v1.json";
import validationSnapshotJson from "../../../../content/packages/content_m2_launch_v1/validation/snapshot.val_snapshot_m2_launch_v1.json";

import {
  createBundledContentRuntime,
  type BundledContentRuntime,
  type RuntimeEncounterPayload,
} from "../../../../packages/content/src/runtime/createBundledContentRuntime.ts";
import type { RuntimeContentPackageManifest } from "../../../../packages/content/src/runtime/contracts/manifest.ts";
import type { RuntimeProgressionDefinition } from "../../../../packages/content/src/runtime/contracts/progression.ts";
import type { RuntimeValidationSnapshot } from "../../../../packages/validation/src/index.ts";

export type BundledPhaseOneContent = BundledContentRuntime;
export type { RuntimeEncounterPayload };

const BUNDLED_PHASE_ONE_CONTENT = createBundledContentRuntime({
  manifest: manifestJson as RuntimeContentPackageManifest,
  progression: progressionJson as RuntimeProgressionDefinition,
  validation_snapshot: validationSnapshotJson as RuntimeValidationSnapshot,
  encounters: [
    starterEncounterJson as RuntimeEncounterPayload,
    meadowEncounterJson as RuntimeEncounterPayload,
  ],
});

export const getBundledPhaseOneContent = (): BundledPhaseOneContent =>
  BUNDLED_PHASE_ONE_CONTENT;
