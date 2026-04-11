import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createLocalContentPackageLoader,
  resolvePhaseOnePackageRoot,
} from "../localContentPackageLoader.js";

const loader = createLocalContentPackageLoader(resolvePhaseOnePackageRoot());

test("loader returns authored encounters by id with canonical payloads", () => {
  const manifest = loader.loadManifest();
  const encounterIds = Object.keys(manifest.payload_files.encounters);

  for (const encounterId of encounterIds) {
    const payload = loader.loadEncounterById(encounterId);
    assert.equal(payload.id, encounterId);
    assert.equal(payload.encounter.id, encounterId);
    assert.equal(payload.contentVersion, manifest.content_version);
    assert.equal(payload.creature.contentVersion, manifest.content_version);
    assert.equal(payload.encounter.contentVersion, manifest.content_version);
  }
});

test("loader returns authored progression and validation snapshot pinned by manifest", () => {
  const manifest = loader.loadManifest();
  const progression = loader.loadProgression();
  const validationSnapshot = loader.loadValidationSnapshot();

  assert.equal(progression.progression_version, manifest.progression_version);
  assert.equal(
    validationSnapshot.metadata.snapshot_version,
    manifest.validation_snapshot_version,
  );
});
