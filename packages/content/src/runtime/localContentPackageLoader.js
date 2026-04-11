import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_CONTENT_PACKAGE_DIR = path.resolve(
  import.meta.dirname,
  "../../../../content/packages/content_m2_launch_v1",
);

const MANIFEST_KEYS = [
  "package_id",
  "content_version",
  "validation_snapshot_version",
  "battle_rules_version",
  "board_generator_version",
  "progression_version",
  "min_supported_app_version",
  "schema_versions",
  "asset_pack_version",
  "created_at_utc",
  "created_by",
  "status",
  "payload_files",
];

const SCHEMA_VERSION_KEYS = [
  "manifest_schema",
  "creature_schema",
  "encounter_schema",
  "progression_schema",
  "validation_snapshot_schema",
];

const PAYLOAD_FILE_KEYS = ["encounters", "progression", "validation"];

const ENCOUNTER_PAYLOAD_KEYS = [
  "id",
  "contentVersion",
  "creature",
  "encounter",
];
const CREATURE_KEYS = [
  "id",
  "displayName",
  "encounterType",
  "difficultyTier",
  "maxHp",
  "weakness",
  "resistance",
  "baseCountdown",
  "spellIdentity",
  "spellPrimitives",
  "phaseRules",
  "contentVersion",
];
const ENCOUNTER_KEYS = [
  "id",
  "creatureId",
  "moveBudget",
  "starPolicyVersion",
  "isStarterEncounter",
  "starterTutorialScript",
  "introFlavorText",
  "damageModelVersion",
  "rewardDefinition",
  "hiddenBonusWordPolicy",
  "boardConfig",
  "balanceMetadata",
  "contentVersion",
];
const BOARD_CONFIG_KEYS = [
  "rows",
  "cols",
  "seedMode",
  "fixedSeed",
  "allowWandTiles",
  "wandSpawnRate",
  "maxConcurrentWands",
  "letterDistributionProfileId",
  "letterWeightEntries",
  "namedLetterPoolId",
  "vowelClassProfileVersion",
  "vowelClassIncludesY",
  "boardQualityPolicy",
];

const PROGRESSION_KEYS = [
  "progression_version",
  "topology",
  "starter_encounter_id",
  "chapters",
];
const PROGRESSION_CHAPTER_KEYS = [
  "chapter_id",
  "display_name",
  "habitat_theme_id",
  "sort_index",
  "encounter_ids",
];

const VALIDATION_SNAPSHOT_KEYS = ["metadata", "castable_words", "element_tags"];
const VALIDATION_METADATA_KEYS = [
  "snapshot_version",
  "language",
  "word_count",
  "tagged_word_count",
  "generated_at_utc",
];

function readJsonOrThrow(filePath) {
  assert.equal(
    fs.existsSync(filePath),
    true,
    `Missing content file: ${filePath}`,
  );
  const fileSource = fs.readFileSync(filePath, "utf8");

  try {
    return JSON.parse(fileSource);
  } catch (error) {
    throw new Error(`Invalid JSON at ${filePath}: ${error.message}`);
  }
}

function assertObject(value, fieldPath) {
  assert.equal(typeof value, "object", `${fieldPath} must be an object`);
  assert.notEqual(value, null, `${fieldPath} must not be null`);
  assert.equal(
    Array.isArray(value),
    false,
    `${fieldPath} must not be an array`,
  );
}

function assertExactKeys(value, expectedKeys, fieldPath) {
  assertObject(value, fieldPath);
  assert.deepEqual(
    Object.keys(value).sort(),
    [...expectedKeys].sort(),
    `${fieldPath} keys drifted from canonical contract`,
  );
}

function assertString(value, fieldPath) {
  assert.equal(typeof value, "string", `${fieldPath} must be a string`);
  assert.notEqual(value.length, 0, `${fieldPath} must not be empty`);
}

function assertManifestContract(manifest) {
  assertExactKeys(manifest, MANIFEST_KEYS, "manifest");
  assertExactKeys(
    manifest.schema_versions,
    SCHEMA_VERSION_KEYS,
    "manifest.schema_versions",
  );
  assertExactKeys(
    manifest.payload_files,
    PAYLOAD_FILE_KEYS,
    "manifest.payload_files",
  );

  assertString(manifest.content_version, "manifest.content_version");
  assertString(
    manifest.validation_snapshot_version,
    "manifest.validation_snapshot_version",
  );
}

function assertEncounterPayloadContract(encounterPayload, encounterId) {
  assertExactKeys(
    encounterPayload,
    ENCOUNTER_PAYLOAD_KEYS,
    `encounter[${encounterId}]`,
  );
  assertExactKeys(
    encounterPayload.creature,
    CREATURE_KEYS,
    `encounter[${encounterId}].creature`,
  );
  assertExactKeys(
    encounterPayload.encounter,
    ENCOUNTER_KEYS,
    `encounter[${encounterId}].encounter`,
  );
  assertExactKeys(
    encounterPayload.encounter.boardConfig,
    BOARD_CONFIG_KEYS,
    `encounter[${encounterId}].encounter.boardConfig`,
  );

  for (const primitive of encounterPayload.creature.spellPrimitives) {
    assertObject(
      primitive,
      `encounter[${encounterId}].creature.spellPrimitives[]`,
    );
    assertString(
      primitive.kind,
      `encounter[${encounterId}].creature.spellPrimitives[].kind`,
    );

    if (primitive.kind === "apply_tile_state") {
      assertExactKeys(
        primitive,
        ["kind", "tile_state", "target_count", "targeting"],
        `encounter[${encounterId}].creature.spellPrimitives.apply_tile_state`,
      );
      continue;
    }

    if (primitive.kind === "shift_row") {
      assertExactKeys(
        primitive,
        ["kind", "row_index", "mode", "distance", "direction"],
        `encounter[${encounterId}].creature.spellPrimitives.shift_row`,
      );
      continue;
    }

    if (primitive.kind === "shift_column") {
      assertExactKeys(
        primitive,
        ["kind", "col_index", "mode", "distance", "direction"],
        `encounter[${encounterId}].creature.spellPrimitives.shift_column`,
      );
      continue;
    }

    if (primitive.kind === "chained") {
      assertExactKeys(
        primitive,
        ["kind", "steps"],
        `encounter[${encounterId}].creature.spellPrimitives.chained`,
      );
      continue;
    }

    assert.fail(
      `encounter[${encounterId}] contains unsupported spell primitive kind: ${primitive.kind}`,
    );
  }
}

function assertProgressionContract(progression) {
  assertExactKeys(progression, PROGRESSION_KEYS, "progression");

  for (const [index, chapter] of progression.chapters.entries()) {
    assertExactKeys(
      chapter,
      PROGRESSION_CHAPTER_KEYS,
      `progression.chapters[${index}]`,
    );
  }
}

function assertValidationSnapshotContract(snapshot) {
  assertExactKeys(snapshot, VALIDATION_SNAPSHOT_KEYS, "validation_snapshot");
  assertExactKeys(
    snapshot.metadata,
    VALIDATION_METADATA_KEYS,
    "validation_snapshot.metadata",
  );

  assert.equal(
    Array.isArray(snapshot.castable_words),
    true,
    "validation_snapshot.castable_words must be an array",
  );
  assertObject(snapshot.element_tags, "validation_snapshot.element_tags");

  const castableWordsSet = new Set(snapshot.castable_words);
  assert.equal(
    castableWordsSet.size,
    snapshot.castable_words.length,
    "validation_snapshot.castable_words must be deduplicated",
  );

  for (const [word, element] of Object.entries(snapshot.element_tags)) {
    assert.equal(
      castableWordsSet.has(word),
      true,
      `validation_snapshot.element_tags[${word}] must exist in castable_words`,
    );
    assertString(element, `validation_snapshot.element_tags[${word}]`);
  }
}

function resolvePayloadFile(packageRoot, relativePath, payloadType, payloadId) {
  const filePath = path.resolve(packageRoot, relativePath);
  const normalizedRoot = `${path.resolve(packageRoot)}${path.sep}`;

  assert.equal(
    filePath.startsWith(normalizedRoot),
    true,
    `${payloadType}[${payloadId}] path escapes package root: ${relativePath}`,
  );

  return filePath;
}

export function resolvePhaseOnePackageRoot() {
  return DEFAULT_CONTENT_PACKAGE_DIR;
}

export function createLocalContentPackageLoader(
  packageRoot = DEFAULT_CONTENT_PACKAGE_DIR,
) {
  const normalizedRoot = path.resolve(packageRoot);

  function loadManifest() {
    const manifestPath = path.join(normalizedRoot, "manifest.json");
    const manifest = readJsonOrThrow(manifestPath);
    assertManifestContract(manifest);
    return manifest;
  }

  function loadEncounterById(encounterId) {
    assertString(encounterId, "encounterId");
    const manifest = loadManifest();
    const encounterRelativePath =
      manifest.payload_files.encounters[encounterId];

    assert.equal(
      typeof encounterRelativePath,
      "string",
      `encounter id not found in manifest.payload_files.encounters: ${encounterId}`,
    );

    const encounterPath = resolvePayloadFile(
      normalizedRoot,
      encounterRelativePath,
      "encounter",
      encounterId,
    );
    const encounterPayload = readJsonOrThrow(encounterPath);
    assertEncounterPayloadContract(encounterPayload, encounterId);
    assert.equal(
      encounterPayload.id,
      encounterId,
      `encounter payload id mismatch for ${encounterId}`,
    );
    assert.equal(
      encounterPayload.contentVersion,
      manifest.content_version,
      `encounter[${encounterId}] contentVersion must match manifest.content_version`,
    );

    return encounterPayload;
  }

  function loadProgression() {
    const manifest = loadManifest();
    const progressionRelativePath =
      manifest.payload_files.progression[manifest.progression_version];

    assert.equal(
      typeof progressionRelativePath,
      "string",
      `progression id not found in manifest.payload_files.progression: ${manifest.progression_version}`,
    );

    const progressionPath = resolvePayloadFile(
      normalizedRoot,
      progressionRelativePath,
      "progression",
      manifest.progression_version,
    );
    const progression = readJsonOrThrow(progressionPath);
    assertProgressionContract(progression);
    assert.equal(
      progression.progression_version,
      manifest.progression_version,
      "progression.progression_version must match manifest.progression_version",
    );

    return progression;
  }

  function loadValidationSnapshot() {
    const manifest = loadManifest();
    const validationRelativePath =
      manifest.payload_files.validation[manifest.validation_snapshot_version];

    assert.equal(
      typeof validationRelativePath,
      "string",
      `validation snapshot id not found in manifest.payload_files.validation: ${manifest.validation_snapshot_version}`,
    );

    const validationPath = resolvePayloadFile(
      normalizedRoot,
      validationRelativePath,
      "validation",
      manifest.validation_snapshot_version,
    );
    const snapshot = readJsonOrThrow(validationPath);
    assertValidationSnapshotContract(snapshot);
    assert.equal(
      snapshot.metadata.snapshot_version,
      manifest.validation_snapshot_version,
      "validation_snapshot.metadata.snapshot_version must match manifest.validation_snapshot_version",
    );

    return snapshot;
  }

  return {
    loadManifest,
    loadEncounterById,
    loadProgression,
    loadValidationSnapshot,
  };
}
