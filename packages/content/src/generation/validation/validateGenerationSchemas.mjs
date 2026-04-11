import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../../../../",
);

const schemaPaths = {
  generationRequest:
    "content/schemas/generation/encounter-generation-request.schema.json",
  blueprint:
    "content/schemas/generation/encounter-archetype-blueprint.schema.json",
  seedData: "content/schemas/generation/generation-seed-data-pool.schema.json",
  generatedDraft:
    "content/schemas/generation/generated-encounter-draft-artifact.schema.json",
};

function loadJson(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateBlueprint(doc, filePath) {
  const errors = [];
  assert(isObject(doc), `${filePath}: must be an object`, errors);
  if (!isObject(doc)) return errors;

  const required = [
    "blueprint_id",
    "display_label",
    "allowed_tiers",
    "encounter_type",
    "pressure_style",
    "spell_identity",
    "allowed_spell_payloads",
    "allowed_matchup_pair_pool_ids",
    "allowed_habitat_tags",
    "profile_overrides",
    "prohibited_combination_flags",
  ];
  for (const key of required)
    assert(
      key in doc,
      `${filePath}: missing required property '${key}'`,
      errors,
    );

  const tierSet = new Set([
    "gentle",
    "standard",
    "challenging",
    "boss",
    "event",
  ]);
  const primitiveSet = new Set([
    "apply_tile_state",
    "shift_row",
    "shift_column",
    "chained",
  ]);

  assert(
    Array.isArray(doc.allowed_tiers) && doc.allowed_tiers.length > 0,
    `${filePath}: allowed_tiers must be a non-empty array`,
    errors,
  );
  if (Array.isArray(doc.allowed_tiers)) {
    doc.allowed_tiers.forEach((tier, index) =>
      assert(
        tierSet.has(tier),
        `${filePath}: allowed_tiers[${index}] has unsupported tier '${tier}'`,
        errors,
      ),
    );
  }

  assert(
    Array.isArray(doc.allowed_spell_payloads) &&
      doc.allowed_spell_payloads.length > 0,
    `${filePath}: allowed_spell_payloads must be a non-empty array`,
    errors,
  );
  if (Array.isArray(doc.allowed_spell_payloads)) {
    doc.allowed_spell_payloads.forEach((payload, index) => {
      assert(
        isObject(payload),
        `${filePath}: allowed_spell_payloads[${index}] must be an object`,
        errors,
      );
      if (!isObject(payload)) return;
      assert(
        typeof payload.template_id === "string" &&
          payload.template_id.length > 0,
        `${filePath}: allowed_spell_payloads[${index}].template_id must be a non-empty string`,
        errors,
      );
      assert(
        primitiveSet.has(payload.primitive_kind),
        `${filePath}: allowed_spell_payloads[${index}].primitive_kind '${payload.primitive_kind}' is unsupported`,
        errors,
      );
    });
  }

  const profile = doc.profile_overrides;
  assert(
    isObject(profile),
    `${filePath}: profile_overrides must be an object`,
    errors,
  );
  if (isObject(profile)) {
    [
      "weakness_hit_rate_delta",
      "wand_incidence_delta",
      "soot_exposure_delta",
      "target_casts_to_defeat_delta",
      "target_spell_count_on_win_delta",
    ].forEach((field) => {
      assert(
        typeof profile[field] === "number",
        `${filePath}: profile_overrides.${field} must be a number`,
        errors,
      );
    });
  }

  return errors;
}

function validateSeedData(doc, filePath) {
  const errors = [];
  assert(isObject(doc), `${filePath}: must be an object`, errors);
  if (!isObject(doc)) return errors;

  assert(
    doc.schema_version === "generation_seed_data_v1",
    `${filePath}: schema_version must be 'generation_seed_data_v1'`,
    errors,
  );

  const arrayFields = [
    "habitat_pools",
    "matchup_pair_pools",
    "name_banks",
    "flavor_banks",
    "spell_payload_templates",
  ];
  for (const field of arrayFields) {
    assert(
      Array.isArray(doc[field]) && doc[field].length > 0,
      `${filePath}: ${field} must be a non-empty array`,
      errors,
    );
  }

  doc.matchup_pair_pools?.forEach((pool, poolIndex) => {
    pool.pairs?.forEach((pair, pairIndex) => {
      if (pair.weakness === pair.resistance) {
        errors.push(
          `${filePath}: matchup_pair_pools[${poolIndex}].pairs[${pairIndex}] weakness and resistance must differ`,
        );
      }
    });
  });

  return errors;
}

function validateCurrentGenerationContent() {
  const failures = [];

  Object.values(schemaPaths).forEach((schemaPath) => {
    try {
      loadJson(schemaPath);
    } catch (error) {
      failures.push(
        `${schemaPath}: schema is not valid JSON (${error.message})`,
      );
    }
  });

  const blueprintDir = path.join(repoRoot, "content/generation/blueprints");
  const blueprintFiles = fs
    .readdirSync(blueprintDir)
    .filter((file) => file.endsWith(".blueprint.json"));

  blueprintFiles.forEach((fileName) => {
    const relativePath = `content/generation/blueprints/${fileName}`;
    const blueprint = loadJson(relativePath);
    failures.push(...validateBlueprint(blueprint, relativePath));
  });

  const seedDataPath = "content/generation/pools/generation-seed-data.v1.json";
  const seedData = loadJson(seedDataPath);
  failures.push(...validateSeedData(seedData, seedDataPath));

  if (failures.length > 0) {
    const formatted = failures.map((error) => ` - ${error}`).join("\n");
    throw new Error(`Generation contract validation failed:\n${formatted}`);
  }

  console.log(
    "Generation contract validation passed for current seed-data and blueprint files.",
  );
  console.log(`Validated blueprints: ${blueprintFiles.length}`);
  console.log(`Validated seed-data file: ${seedDataPath}`);
}

validateCurrentGenerationContent();
