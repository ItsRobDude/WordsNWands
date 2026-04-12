import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import type { RuntimeContentPackageManifest } from "./contracts/manifest.js";
import type { RuntimeProgressionDefinition } from "./contracts/progression.js";
import {
  createBundledContentRuntime,
  type RuntimeEncounterPayload,
} from "./createBundledContentRuntime.js";
import type { RuntimeValidationSnapshot } from "../../../validation/src/contracts/types.js";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const bundleRoot = path.resolve(
  moduleDir,
  "../../../../content/packages/content_m2_launch_v1",
);
const manifestJson = readJsonFile(
  path.join(bundleRoot, "manifest.json"),
) as RuntimeContentPackageManifest;
const starterEncounterJson = readJsonFile(
  path.join(bundleRoot, "encounters/enc_starter_001.json"),
) as RuntimeEncounterPayload;
const meadowEncounterJson = readJsonFile(
  path.join(bundleRoot, "encounters/enc_meadow_001.json"),
) as RuntimeEncounterPayload;
const progressionJson = readJsonFile(
  path.join(
    bundleRoot,
    "progression/progression.progression_m2_chapter_linear_v1.json",
  ),
) as RuntimeProgressionDefinition;
const validationSnapshotJson = readJsonFile(
  path.join(bundleRoot, "validation/snapshot.val_snapshot_m2_launch_v1.json"),
) as RuntimeValidationSnapshot;

test("createBundledContentRuntime returns encounter lookups for the approved bundle", () => {
  const runtime = createBundledContentRuntime({
    manifest: manifestJson as RuntimeContentPackageManifest,
    progression: progressionJson as RuntimeProgressionDefinition,
    validation_snapshot: validationSnapshotJson as RuntimeValidationSnapshot,
    encounters: [
      starterEncounterJson as RuntimeEncounterPayload,
      meadowEncounterJson as RuntimeEncounterPayload,
    ],
  });

  assert.equal(runtime.progression.starter_encounter_id, "enc_starter_001");
  assert.equal(
    runtime.encounters_by_id.enc_meadow_001?.creature.displayName,
    "Cinder Cub",
  );
});

test("createBundledContentRuntime rejects bundles with progression references to missing encounters", () => {
  assert.throws(
    () =>
      createBundledContentRuntime({
        manifest: manifestJson,
        progression: {
          ...progressionJson,
          chapters: [
            {
              ...progressionJson.chapters[0]!,
              encounter_ids: ["enc_missing_001"],
            },
          ],
        },
        validation_snapshot: validationSnapshotJson,
        encounters: [starterEncounterJson],
      }),
    /enc_missing_001/,
  );
});

function readJsonFile(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
