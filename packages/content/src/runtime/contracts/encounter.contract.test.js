import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.resolve(import.meta.dirname, "../../../../../");
const encounterContractPath = path.join(
  repoRoot,
  "packages/content/src/runtime/contracts/encounter.ts",
);

const authoredEncounterPaths = [
  path.join(
    repoRoot,
    "content/packages/content_m2_launch_v1/encounters/enc_starter_001.json",
  ),
  path.join(
    repoRoot,
    "content/packages/content_m2_launch_v1/encounters/enc_meadow_001.json",
  ),
];

function getInterfaceBlock(source, interfaceName) {
  const startToken = `export interface ${interfaceName} {`;
  const startIndex = source.indexOf(startToken);
  assert.notEqual(
    startIndex,
    -1,
    `${interfaceName} not found in encounter contract`,
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
    `Unable to parse ${interfaceName} block from encounter contract`,
  );
  return source.slice(bodyStart, cursor - 1);
}

function getInterfaceFieldNames(source, interfaceName) {
  const body = getInterfaceBlock(source, interfaceName);
  return [...body.matchAll(/^\s{2}([a-zA-Z0-9_]+):/gm)].map(
    (match) => match[1],
  );
}

function expectExactKeys(actualObject, expectedKeys, fieldPath) {
  const actual = Object.keys(actualObject).sort();
  const expected = [...expectedKeys].sort();
  assert.deepEqual(
    actual,
    expected,
    `${fieldPath} keys drifted from encounter contract`,
  );
}

function parseAuthoredEncounterPayloads() {
  return authoredEncounterPaths.map((filePath) =>
    JSON.parse(fs.readFileSync(filePath, "utf8")),
  );
}

test("authored encounters include required canonical creature/encounter fields", () => {
  const encounterContractSource = fs.readFileSync(
    encounterContractPath,
    "utf8",
  );
  const creatureFields = getInterfaceFieldNames(
    encounterContractSource,
    "RuntimeCreatureDefinition",
  );
  const encounterFields = getInterfaceFieldNames(
    encounterContractSource,
    "RuntimeEncounterDefinition",
  );

  for (const payload of parseAuthoredEncounterPayloads()) {
    expectExactKeys(
      payload,
      ["id", "contentVersion", "creature", "encounter"],
      payload.id,
    );
    expectExactKeys(payload.creature, creatureFields, `${payload.id}.creature`);
    expectExactKeys(
      payload.encounter,
      encounterFields,
      `${payload.id}.encounter`,
    );
  }
});

test("authored encounters use canonical structured spell primitives", () => {
  for (const payload of parseAuthoredEncounterPayloads()) {
    for (const primitive of payload.creature.spellPrimitives) {
      assert.equal(
        typeof primitive,
        "object",
        `${payload.id} spell primitive must be an object`,
      );
      assert.notEqual(
        primitive,
        null,
        `${payload.id} spell primitive cannot be null`,
      );
      assert.equal(
        Array.isArray(primitive),
        false,
        `${payload.id} spell primitive cannot be a tokenized string array`,
      );
      assert.equal(
        typeof primitive.kind,
        "string",
        `${payload.id} primitive.kind is required`,
      );

      if (primitive.kind === "apply_tile_state") {
        expectExactKeys(
          primitive,
          ["kind", "tile_state", "target_count", "targeting"],
          `${payload.id}.creature.spellPrimitives.apply_tile_state`,
        );
        continue;
      }

      if (primitive.kind === "shift_row") {
        expectExactKeys(
          primitive,
          ["kind", "row_index", "mode", "distance", "direction"],
          `${payload.id}.creature.spellPrimitives.shift_row`,
        );
        continue;
      }

      if (primitive.kind === "shift_column") {
        expectExactKeys(
          primitive,
          ["kind", "col_index", "mode", "distance", "direction"],
          `${payload.id}.creature.spellPrimitives.shift_column`,
        );
        continue;
      }

      if (primitive.kind === "chained") {
        expectExactKeys(
          primitive,
          ["kind", "steps"],
          `${payload.id}.creature.spellPrimitives.chained`,
        );
        continue;
      }

      assert.fail(
        `${payload.id} contains unsupported spell primitive kind: ${primitive.kind}`,
      );
    }
  }
});
