import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../../../../../");
const manifestContractPath = path.join(
  repoRoot,
  "packages/content/src/runtime/contracts/manifest.ts",
);
const authoredManifestPath = path.join(
  repoRoot,
  "content/packages/content_m2_launch_v1/manifest.json",
);

function getInterfaceBlock(source, interfaceName) {
  const startToken = `export interface ${interfaceName} {`;
  const startIndex = source.indexOf(startToken);
  assert.notEqual(
    startIndex,
    -1,
    `${interfaceName} not found in manifest contract`,
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
    `Unable to parse ${interfaceName} block from manifest contract`,
  );
  return source.slice(bodyStart, cursor - 1);
}

function getInterfaceFieldNames(source, interfaceName) {
  const body = getInterfaceBlock(source, interfaceName);
  return [...body.matchAll(/^\s{2}([a-z0-9_]+):/gm)].map((match) => match[1]);
}

function expectExactKeys(actualObject, expectedKeys, fieldPath) {
  const actual = Object.keys(actualObject).sort();
  const expected = [...expectedKeys].sort();
  assert.deepEqual(
    actual,
    expected,
    `${fieldPath} keys drifted from manifest contract`,
  );
}

test("authored manifest matches canonical manifest contract fields exactly", () => {
  const manifestContractSource = fs.readFileSync(manifestContractPath, "utf8");
  const authoredManifest = JSON.parse(
    fs.readFileSync(authoredManifestPath, "utf8"),
  );

  const topLevelFields = getInterfaceFieldNames(
    manifestContractSource,
    "RuntimeContentPackageManifest",
  );
  const schemaVersionFields = getInterfaceFieldNames(
    manifestContractSource,
    "RuntimeContentPackageSchemaVersions",
  );
  const payloadFileFields = getInterfaceFieldNames(
    manifestContractSource,
    "RuntimeContentPackagePayloadFiles",
  );

  expectExactKeys(authoredManifest, topLevelFields, "manifest");
  expectExactKeys(
    authoredManifest.schema_versions,
    schemaVersionFields,
    "manifest.schema_versions",
  );
  expectExactKeys(
    authoredManifest.payload_files,
    payloadFileFields,
    "manifest.payload_files",
  );
});

test("manifest contract and authored manifest use snake_case field naming", () => {
  const manifestContractSource = fs.readFileSync(manifestContractPath, "utf8");
  const authoredManifest = JSON.parse(
    fs.readFileSync(authoredManifestPath, "utf8"),
  );

  const allContractFields = [
    ...getInterfaceFieldNames(
      manifestContractSource,
      "RuntimeContentPackageManifest",
    ),
    ...getInterfaceFieldNames(
      manifestContractSource,
      "RuntimeContentPackageSchemaVersions",
    ),
    ...getInterfaceFieldNames(
      manifestContractSource,
      "RuntimeContentPackagePayloadFiles",
    ),
  ];

  for (const field of allContractFields) {
    assert.match(
      field,
      /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
      `Contract field is not snake_case: ${field}`,
    );
  }

  const authoredFields = [
    ...Object.keys(authoredManifest),
    ...Object.keys(authoredManifest.schema_versions),
    ...Object.keys(authoredManifest.payload_files),
  ];

  for (const field of authoredFields) {
    assert.match(
      field,
      /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
      `Authored field is not snake_case: ${field}`,
    );
  }
});
