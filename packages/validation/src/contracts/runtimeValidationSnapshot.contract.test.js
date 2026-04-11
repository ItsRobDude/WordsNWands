import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { InMemoryValidationSnapshotLookup } from "./ValidationSnapshotLookup.ts";
import { InMemoryValidationSnapshotLookupProvider } from "./ValidationSnapshotLookupProvider.ts";

const repoRoot = path.resolve(import.meta.dirname, "../../../../");
const runtimeContractPath = path.join(
  repoRoot,
  "packages/validation/src/contracts/types.ts",
);
const authoredSnapshotPath = path.join(
  repoRoot,
  "content/packages/content_m2_launch_v1/validation/snapshot.val_snapshot_m2_launch_v1.json",
);

function getInterfaceBlock(source, interfaceName) {
  const startToken = `export interface ${interfaceName} {`;
  const startIndex = source.indexOf(startToken);
  assert.notEqual(
    startIndex,
    -1,
    `${interfaceName} not found in runtime contract`,
  );

  const bodyStart = startIndex + startToken.length;
  let depth = 1;
  let cursor = bodyStart;

  while (cursor < source.length && depth > 0) {
    const char = source[cursor];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }
    cursor += 1;
  }

  assert.equal(
    depth,
    0,
    `Unable to parse ${interfaceName} from runtime contract`,
  );
  return source.slice(bodyStart, cursor - 1);
}

function getInterfaceFieldNames(source, interfaceName) {
  const body = getInterfaceBlock(source, interfaceName);
  return [...body.matchAll(/^\s{2}([a-z0-9_]+):/gm)].map((match) => match[1]);
}

test("authored runtime validation snapshot uses canonical runtime schema fields", () => {
  const runtimeContractSource = fs.readFileSync(runtimeContractPath, "utf8");
  const authoredSnapshot = JSON.parse(
    fs.readFileSync(authoredSnapshotPath, "utf8"),
  );

  const expectedTopLevel = getInterfaceFieldNames(
    runtimeContractSource,
    "RuntimeValidationSnapshot",
  );
  const expectedMetadata = getInterfaceFieldNames(
    runtimeContractSource,
    "ValidationSnapshotMetadata",
  );

  assert.deepEqual(
    Object.keys(authoredSnapshot).sort(),
    expectedTopLevel.sort(),
  );
  assert.deepEqual(
    Object.keys(authoredSnapshot.metadata).sort(),
    expectedMetadata.sort(),
  );
  assert.equal("anchors" in authoredSnapshot, false);
});

test("anchor-format payload is rejected as a runtime validation snapshot", () => {
  const anchorPayload = {
    validation_snapshot_version: "val_snapshot_m2_launch_v1",
    content_version: "content_m2_launch_v1",
    anchors: {
      flame: ["burn"],
      arcane_support: ["spell"],
    },
  };

  assert.throws(() => {
    new InMemoryValidationSnapshotLookup(anchorPayload);
  });
});

test("authored runtime snapshot loads through provider lookup path without adapters", () => {
  const authoredSnapshot = JSON.parse(
    fs.readFileSync(authoredSnapshotPath, "utf8"),
  );

  const provider = new InMemoryValidationSnapshotLookupProvider([
    authoredSnapshot,
  ]);
  const lookup = provider.get(authoredSnapshot.metadata.snapshot_version);

  assert.equal(lookup.hasWord("burn"), true);
  assert.equal(lookup.hasPrefix("bur"), true);
  assert.equal(lookup.getEntry("burn")?.element, "flame");
  assert.equal(lookup.getMaxWordLength() >= 4, true);

  assert.equal(lookup.hasWord("calm"), true);
  assert.equal(lookup.hasPrefix("cal"), true);
  assert.equal(lookup.getEntry("calm")?.element, "arcane");

  assert.equal(lookup.getEntry("definitelynotaword"), null);
  assert.equal(lookup.hasPrefix("definitelynotaword"), false);
});
