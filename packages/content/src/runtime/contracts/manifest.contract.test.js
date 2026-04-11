import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createLocalContentPackageLoader,
  resolvePhaseOnePackageRoot,
} from "../localContentPackageLoader.js";

const loader = createLocalContentPackageLoader(resolvePhaseOnePackageRoot());

test("loader returns authored manifest with exact canonical top-level structure", () => {
  const manifest = loader.loadManifest();

  assert.equal(manifest.content_version, "content_m2_launch_v1");
  assert.equal(
    manifest.progression_version,
    "progression_m2_chapter_linear_v1",
  );
  assert.equal(
    manifest.validation_snapshot_version,
    "val_snapshot_m2_launch_v1",
  );
});

test("authored manifest keys remain snake_case", () => {
  const manifest = loader.loadManifest();

  const authoredFields = [
    ...Object.keys(manifest),
    ...Object.keys(manifest.schema_versions),
    ...Object.keys(manifest.payload_files),
  ];

  for (const field of authoredFields) {
    assert.match(
      field,
      /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
      `Authored field is not snake_case: ${field}`,
    );
  }
});
