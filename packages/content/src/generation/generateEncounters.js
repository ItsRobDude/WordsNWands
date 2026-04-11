import fs from 'node:fs';
import path from 'node:path';
import { createDeterministicRng } from './rng.js';
import { readJsonFile, validateRequestShape } from './contracts.js';
import { deriveEncounterNumbers, resolveTierProfile } from './balance.js';
import { renderReviewMarkdown } from './review/renderReview.js';

const ROOT = process.cwd();
const BLUEPRINT_DIR = path.join(ROOT, 'content/generation/blueprints');
const SEED_DATA_PATH = path.join(ROOT, 'content/generation/pools/generation-seed-data.v1.json');
const OUTPUT_DIR = path.join(ROOT, 'content/generation/generated/drafts');

export function generateFromRequestFile(requestFilePath) {
  const absoluteRequestPath = path.isAbsolute(requestFilePath)
    ? requestFilePath
    : path.join(ROOT, requestFilePath);

  if (!fs.existsSync(absoluteRequestPath)) {
    throw new Error(`Request file not found: ${absoluteRequestPath}`);
  }

  const request = runRequestSchemaPass(readJsonFile(absoluteRequestPath));
  const rng = createDeterministicRng(request.generation_seed);
  const seedData = readJsonFile(SEED_DATA_PATH);

  const blueprints = loadBlueprints(request.blueprint_ids);
  const habitatPool = resolveHabitats(seedData.habitat_pools, request.habitat_pool_ids);
  const spellTemplatesById = new Map(seedData.spell_payload_templates.map((template) => [template.template_id, template]));

  const artifacts = [];
  for (let slot = 0; slot < request.encounter_count; slot += 1) {
    const blueprint = pickLegalBlueprint(rng, blueprints, request.target_tier);
    const habitat = pickLegalHabitat(rng, habitatPool, blueprint, request.board_profile_ids);
    const pair = pickMatchupPair(rng, seedData.matchup_pair_pools, blueprint);

    runBlueprintLegalityPass(blueprint, request.target_tier);

    const profile = resolveTierProfile(request.target_tier, request.target_fail_rate_band, blueprint.profile_overrides);
    const derived = deriveEncounterNumbers(request.target_tier, request.target_fail_rate_band, profile);

    const spellPayload = buildSpellPayload(rng, blueprint, spellTemplatesById);
    const boardProfileId = pickBoardProfile(rng, habitat, request.board_profile_ids);
    const name = selectName(rng, seedData.name_banks, blueprint.blueprint_id, request.allow_name_generation_from_bank);
    const flavor = selectFlavor(rng, seedData.flavor_banks, blueprint.blueprint_id, request.allow_flavor_generation_from_bank);
    runFlavorBankLegalityPass({
      blueprintId: blueprint.blueprint_id,
      allowNameGenerationFromBank: request.allow_name_generation_from_bank,
      allowFlavorGenerationFromBank: request.allow_flavor_generation_from_bank,
      generatedName: name,
      generatedFlavor: flavor
    });

    const draftId = `draft_${habitat.habitat_theme_id.replace('habitat_', '').replace('_v1', '')}_${blueprint.blueprint_id.replace('_v1', '')}_${request.target_tier}_${request.generation_seed.slice(0, 8)}_${slot + 1}`;

    const creatureDefinition = {
      creature_id: `cre_${draftId}`,
      display_name: name,
      encounter_type: blueprint.encounter_type,
      difficulty_tier: request.target_tier,
      max_hp: derived.derived_hp,
      weakness: pair.weakness,
      resistance: pair.resistance,
      base_countdown: derived.derived_base_countdown,
      spell_identity: blueprint.spell_identity,
      spell_payload: spellPayload
    };

    const encounterDefinition = {
      encounter_id: `enc_${draftId}`,
      creature_id: creatureDefinition.creature_id,
      move_budget: derived.derived_move_budget,
      board_profile_id: boardProfileId,
      pins: {
        content_version_pin: request.content_version_target,
        validation_snapshot_version_pin: request.validation_snapshot_version_target,
        battle_rules_version_pin: request.battle_rules_version_target,
        board_generator_version_pin: request.board_generator_version_target,
        damage_model_version: 'damage_model_v1'
      },
      intro_flavor_text: flavor
    };

    const artifact = {
      draft_id: draftId,
      request_id: request.request_id,
      generator_version: request.generator_version,
      generator_mode: request.generator_mode,
      generation_seed: request.generation_seed,
      blueprint_id: blueprint.blueprint_id,
      target_tier: request.target_tier,
      content_version_target: request.content_version_target,
      validation_snapshot_version_target: request.validation_snapshot_version_target,
      battle_rules_version_target: request.battle_rules_version_target,
      board_generator_version_target: request.board_generator_version_target,
      encounter_definition: encounterDefinition,
      creature_definition: creatureDefinition,
      review_summary: {
        habitat_theme_id: habitat.habitat_theme_id,
        habitat_display_name: habitat.display_name,
        creature_display_name: creatureDefinition.display_name,
        weakness: pair.weakness,
        resistance: pair.resistance,
        move_budget: derived.derived_move_budget,
        base_countdown: derived.derived_base_countdown,
        max_hp: derived.derived_hp,
        spell_identity: blueprint.spell_identity,
        why_it_should_feel_fair: 'The countdown and move budget were derived from the canonical fail-rate and pace formulas with tier guardrail clamping.',
        why_it_matches_wordsnwands: 'This draft uses a single approved blueprint identity, approved matchup pool, and curated flavor bank content only.'
      },
      balance_report: {
        expected_profile: profile,
        derived_values: derived,
        validator_findings: [],
        guardrail_status: 'pass'
      }
    };

    validateGeneratedArtifact(artifact, blueprint, request);
    artifacts.push(artifact);
  }

  applyDuplicateBatchSanityPass(artifacts);
  return writeArtifacts(artifacts);
}

function runRequestSchemaPass(rawRequest) {
  try {
    return validateRequestShape(rawRequest);
  } catch (error) {
    throw new Error(
      `Validation failed during request schema pass:\n- [REQUEST_SCHEMA][error] ${error.message}`
    );
  }
}

function loadBlueprints(requestedIds) {
  const available = fs.readdirSync(BLUEPRINT_DIR).filter((entry) => entry.endsWith('.blueprint.json'));
  const byId = new Map();
  for (const entry of available) {
    const blueprint = readJsonFile(path.join(BLUEPRINT_DIR, entry));
    byId.set(blueprint.blueprint_id, blueprint);
  }

  const resolved = requestedIds.map((id) => {
    const blueprint = byId.get(id);
    if (!blueprint) {
      throw new Error(`Unknown blueprint in request: ${id}`);
    }
    return blueprint;
  });

  return resolved;
}

function resolveHabitats(habitatPools, requestedPoolIds) {
  const selectedPools = habitatPools.filter((pool) => requestedPoolIds.includes(pool.habitat_pool_id));
  if (selectedPools.length === 0) {
    throw new Error('No habitats resolved. habitat_pool_ids did not match available pools.');
  }
  return selectedPools.flatMap((pool) => pool.habitats);
}

function pickLegalBlueprint(rng, blueprints, targetTier) {
  const legal = blueprints.filter((blueprint) => blueprint.allowed_tiers.includes(targetTier));
  if (legal.length === 0) {
    throw new Error(`No legal blueprints support target tier: ${targetTier}`);
  }
  return rng.pickOne(legal);
}

function runBlueprintLegalityPass(blueprint, targetTier) {
  const findings = [];
  if (!Array.isArray(blueprint.allowed_tiers) || blueprint.allowed_tiers.length === 0) {
    findings.push(`[BLUEPRINT_LEGALITY][error] ${blueprint.blueprint_id}: allowed_tiers must be a non-empty array.`);
  }
  if (!blueprint.allowed_tiers?.includes(targetTier)) {
    findings.push(`[BLUEPRINT_LEGALITY][error] ${blueprint.blueprint_id}: target tier '${targetTier}' is not allowed by this blueprint.`);
  }
  if (!Array.isArray(blueprint.allowed_spell_payloads) || blueprint.allowed_spell_payloads.length === 0) {
    findings.push(`[BLUEPRINT_LEGALITY][error] ${blueprint.blueprint_id}: blueprint must define at least one allowed spell payload template.`);
  }
  if (!Array.isArray(blueprint.allowed_matchup_pair_pool_ids) || blueprint.allowed_matchup_pair_pool_ids.length === 0) {
    findings.push(`[BLUEPRINT_LEGALITY][error] ${blueprint.blueprint_id}: blueprint must define at least one matchup pair pool.`);
  }
  if (!Array.isArray(blueprint.allowed_habitat_tags) || blueprint.allowed_habitat_tags.length === 0) {
    findings.push(`[BLUEPRINT_LEGALITY][error] ${blueprint.blueprint_id}: blueprint must define at least one legal habitat tag.`);
  }
  if (findings.length > 0) {
    throw new Error(`Validation failed during blueprint legality pass:\n- ${findings.join('\n- ')}`);
  }
}

function pickLegalHabitat(rng, habitats, blueprint, requestedBoardProfiles) {
  const legal = habitats.filter((habitat) => {
    const hasAllowedTag = habitat.tags.some((tag) => blueprint.allowed_habitat_tags.includes(tag));
    const hasBoardIntersection = habitat.allowed_board_profile_ids.some((id) => requestedBoardProfiles.includes(id));
    return hasAllowedTag && hasBoardIntersection;
  });
  if (legal.length === 0) {
    throw new Error(`No legal habitats for blueprint ${blueprint.blueprint_id} and requested board profiles.`);
  }
  return rng.pickOne(legal);
}

function pickMatchupPair(rng, pairPools, blueprint) {
  const pool = pairPools.find((candidate) => blueprint.allowed_matchup_pair_pool_ids.includes(candidate.pair_pool_id));
  if (!pool || pool.pairs.length === 0) {
    throw new Error(`No matchup pair pool found for blueprint ${blueprint.blueprint_id}.`);
  }
  const pair = rng.pickOne(pool.pairs);
  if (pair.weakness === pair.resistance) {
    throw new Error(`Illegal matchup pair selected (${pair.weakness}/${pair.resistance}).`);
  }
  return pair;
}

function buildSpellPayload(rng, blueprint, templatesById) {
  const templateRef = rng.pickOne(blueprint.allowed_spell_payloads);
  const template = templatesById.get(templateRef.template_id);
  if (!template) {
    throw new Error(`Missing spell payload template: ${templateRef.template_id}`);
  }
  if (template.primitive_kind !== templateRef.primitive_kind) {
    throw new Error(`Spell primitive mismatch for template ${templateRef.template_id}.`);
  }

  const payload = { template_id: template.template_id, primitive_kind: template.primitive_kind };

  if (template.primitive_kind === 'apply_tile_state') {
    payload.tile_state = template.parameter_policy.tile_state;
    payload.target_count = rng.pickIntInclusive(template.parameter_policy.target_count_min, template.parameter_policy.target_count_max);
    payload.targeting = template.parameter_policy.targeting;
  } else if (template.primitive_kind === 'shift_row') {
    payload.mode = template.parameter_policy.mode;
    payload.distance = template.parameter_policy.distance;
    payload.direction = rng.pickOne(template.parameter_policy.direction_options);
    payload.row_index_strategy = template.parameter_policy.row_index_strategy;
  } else if (template.primitive_kind === 'shift_column') {
    payload.mode = template.parameter_policy.mode;
    payload.distance = template.parameter_policy.distance;
    payload.direction = rng.pickOne(template.parameter_policy.direction_options);
    payload.col_index_strategy = template.parameter_policy.col_index_strategy;
  } else {
    throw new Error(`Unsupported primitive_kind in v1 generator: ${template.primitive_kind}`);
  }

  return payload;
}

function pickBoardProfile(rng, habitat, requestedBoardProfiles) {
  const legal = habitat.allowed_board_profile_ids.filter((id) => requestedBoardProfiles.includes(id));
  if (legal.length === 0) {
    throw new Error(`No legal board profile for habitat ${habitat.habitat_theme_id}.`);
  }
  return rng.pickOne(legal);
}

function selectName(rng, nameBanks, blueprintId, allowBank) {
  if (!allowBank) {
    return `Draft ${blueprintId}`;
  }
  const bank = nameBanks.find((candidate) => candidate.associated_blueprint_ids.includes(blueprintId));
  if (!bank || bank.names.length === 0) {
    throw new Error(`No name bank found for blueprint ${blueprintId}.`);
  }
  return rng.pickOne(bank.names);
}

function selectFlavor(rng, flavorBanks, blueprintId, allowBank) {
  if (!allowBank) {
    return 'Draft flavor placeholder for review.';
  }
  const bank = flavorBanks.find((candidate) => candidate.associated_blueprint_ids.includes(blueprintId));
  if (!bank || bank.lines.length === 0) {
    throw new Error(`No flavor bank found for blueprint ${blueprintId}.`);
  }
  return rng.pickOne(bank.lines);
}

function runFlavorBankLegalityPass({
  blueprintId,
  allowNameGenerationFromBank,
  allowFlavorGenerationFromBank,
  generatedName,
  generatedFlavor
}) {
  const findings = [];
  if (allowNameGenerationFromBank && generatedName.startsWith('Draft ')) {
    findings.push(`[FLAVOR_BANK_LEGALITY][error] ${blueprintId}: name generation is enabled but a placeholder name was emitted.`);
  }
  if (allowFlavorGenerationFromBank && generatedFlavor.startsWith('Draft flavor placeholder')) {
    findings.push(`[FLAVOR_BANK_LEGALITY][error] ${blueprintId}: flavor generation is enabled but a placeholder flavor line was emitted.`);
  }
  if (typeof generatedName !== 'string' || generatedName.trim().length === 0) {
    findings.push(`[FLAVOR_BANK_LEGALITY][error] ${blueprintId}: generated creature name must be a readable non-empty string.`);
  }
  if (typeof generatedFlavor !== 'string' || generatedFlavor.trim().length === 0) {
    findings.push(`[FLAVOR_BANK_LEGALITY][error] ${blueprintId}: generated flavor text must be a readable non-empty string.`);
  }

  if (findings.length > 0) {
    throw new Error(`Validation failed during flavor-bank legality pass:\n- ${findings.join('\n- ')}`);
  }
}

function validateGeneratedArtifact(artifact, blueprint, request) {
  const findings = [];
  const creature = artifact.creature_definition;
  const encounter = artifact.encounter_definition;
  const derived = artifact.balance_report.derived_values;

  if (creature.weakness === creature.resistance) {
    findings.push(createFinding('RUNTIME_CONTRACT', 'error', 'RT-CONTRACT-001', 'Weakness and resistance must be different.'));
  }
  if (!blueprint.allowed_tiers.includes(artifact.target_tier)) {
    findings.push(createFinding('BLUEPRINT_LEGALITY', 'error', 'BP-LEGAL-001', `Target tier '${artifact.target_tier}' is not allowed by blueprint '${blueprint.blueprint_id}'.`));
  }
  if (encounter.pins.damage_model_version !== 'damage_model_v1') {
    findings.push(createFinding('RUNTIME_CONTRACT', 'error', 'RT-CONTRACT-002', 'Encounter pins must include damage_model_v1.'));
  }
  if (encounter.pins.content_version_pin !== request.content_version_target ||
      encounter.pins.validation_snapshot_version_pin !== request.validation_snapshot_version_target ||
      encounter.pins.battle_rules_version_pin !== request.battle_rules_version_target ||
      encounter.pins.board_generator_version_pin !== request.board_generator_version_target) {
    findings.push(createFinding('RUNTIME_CONTRACT', 'error', 'RT-CONTRACT-003', 'Encounter version pins must exactly match the request targets.'));
  }

  const recomputed = deriveEncounterNumbers(request.target_tier, request.target_fail_rate_band, {
    ...artifact.balance_report.expected_profile,
    target_casts_to_defeat: derived.target_casts_to_defeat,
    target_spell_count_on_win: derived.target_spell_count_on_win
  });
  if (
    recomputed.derived_hp !== derived.derived_hp ||
    recomputed.derived_move_budget !== derived.derived_move_budget ||
    recomputed.derived_base_countdown !== derived.derived_base_countdown
  ) {
    findings.push(createFinding('BALANCE_FRAMEWORK', 'error', 'BF-PARITY-001', 'Derived HP/move/countdown must match canonical balance formulas.'));
  }
  if (request.target_tier === 'standard' && request.target_fail_rate_band === 'high') {
    findings.push(createFinding('BALANCE_FRAMEWORK', 'error', 'BF-FAIL-001', 'Standard encounters cannot target high fail-rate band without an explicit waiver.'));
  }
  const targetSpellCount = derived.target_spell_count_on_win;
  if (request.target_fail_rate_band === 'low' && (targetSpellCount < 1 || targetSpellCount > 2)) {
    findings.push(createFinding('BALANCE_FRAMEWORK', 'warn', 'BF-SPELL-001', `Low fail-rate band expects target_spell_count_on_win in [1, 2], got ${targetSpellCount}.`));
  }
  if (request.target_fail_rate_band === 'medium' && (targetSpellCount < 2 || targetSpellCount > 3)) {
    findings.push(createFinding('BALANCE_FRAMEWORK', 'warn', 'BF-SPELL-002', `Medium fail-rate band expects target_spell_count_on_win in [2, 3], got ${targetSpellCount}.`));
  }
  if (request.target_fail_rate_band === 'high' && (targetSpellCount < 3 || targetSpellCount > 4)) {
    findings.push(createFinding('BALANCE_FRAMEWORK', 'warn', 'BF-SPELL-003', `High fail-rate band expects target_spell_count_on_win in [3, 4], got ${targetSpellCount}.`));
  }

  if (creature.encounter_type === 'standard' && !['gentle', 'standard', 'challenging'].includes(artifact.target_tier)) {
    findings.push(createFinding('CREATURE_RULE_GUARDRAIL', 'error', 'CER-STANDARD-001', `Standard creature encounters cannot use tier '${artifact.target_tier}'.`));
  }
  if (typeof creature.spell_identity !== 'string' || creature.spell_identity.trim().length === 0) {
    findings.push(createFinding('CREATURE_RULE_GUARDRAIL', 'error', 'CER-SPELL-001', 'Creature must define one readable primary spell identity.'));
  }

  artifact.balance_report.validator_findings = findings;
  artifact.balance_report.guardrail_status = computeGuardrailStatus(findings);

  const blockingFindings = findings.filter((finding) => finding.severity === 'error');
  if (blockingFindings.length > 0) {
    const messages = blockingFindings.map((finding) => `- [${finding.pass_id}][${finding.code}] ${finding.message}`).join('\n');
    throw new Error(`Generated artifact ${artifact.draft_id} failed validator passes:\n${messages}`);
  }
}

function applyDuplicateBatchSanityPass(artifacts) {
  const blueprintCounts = countBy(artifacts, (artifact) => artifact.blueprint_id);
  const matchupCounts = countBy(
    artifacts,
    (artifact) => `${artifact.review_summary.weakness}/${artifact.review_summary.resistance}`
  );
  const spellCounts = countBy(artifacts, (artifact) => artifact.creature_definition.spell_identity);
  const overuseThreshold = Math.max(2, Math.ceil(artifacts.length * 0.5));

  for (const artifact of artifacts) {
    const warnings = [];
    if ((blueprintCounts.get(artifact.blueprint_id) ?? 0) >= overuseThreshold) {
      warnings.push(createFinding('DUPLICATE_BATCH_SANITY', 'warn', 'DBS-BLUEPRINT-001', `Blueprint '${artifact.blueprint_id}' appears ${blueprintCounts.get(artifact.blueprint_id)} times in this batch.`));
    }
    const matchupKey = `${artifact.review_summary.weakness}/${artifact.review_summary.resistance}`;
    if ((matchupCounts.get(matchupKey) ?? 0) >= overuseThreshold) {
      warnings.push(createFinding('DUPLICATE_BATCH_SANITY', 'warn', 'DBS-MATCHUP-001', `Matchup '${matchupKey}' appears ${matchupCounts.get(matchupKey)} times in this batch.`));
    }
    const spellIdentity = artifact.creature_definition.spell_identity;
    if ((spellCounts.get(spellIdentity) ?? 0) >= overuseThreshold) {
      warnings.push(createFinding('DUPLICATE_BATCH_SANITY', 'warn', 'DBS-SPELL-001', `Spell identity '${spellIdentity}' appears ${spellCounts.get(spellIdentity)} times in this batch.`));
    }

    artifact.balance_report.validator_findings.push(...warnings);
    artifact.balance_report.guardrail_status = computeGuardrailStatus(artifact.balance_report.validator_findings);
  }
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function createFinding(pass_id, severity, code, message) {
  return { pass_id, severity, code, message };
}

function computeGuardrailStatus(findings) {
  if (findings.some((finding) => finding.severity === 'error')) {
    return 'error';
  }
  if (findings.some((finding) => finding.severity === 'warn')) {
    return 'warn';
  }
  return 'pass';
}

function writeArtifacts(artifacts) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const writes = [];
  for (const artifact of artifacts) {
    const base = path.join(OUTPUT_DIR, artifact.draft_id);
    const encounterPath = `${base}.encounter.json`;
    const creaturePath = `${base}.creature.json`;
    const reportPath = `${base}.report.json`;
    const reviewPath = `${base}.review.md`;

    fs.writeFileSync(encounterPath, `${JSON.stringify(artifact.encounter_definition, null, 2)}\n`);
    fs.writeFileSync(creaturePath, `${JSON.stringify(artifact.creature_definition, null, 2)}\n`);
    fs.writeFileSync(reportPath, `${JSON.stringify(artifact, null, 2)}\n`);
    fs.writeFileSync(reviewPath, `${renderReviewMarkdown(artifact)}\n`);

    writes.push({ draft_id: artifact.draft_id, encounterPath, creaturePath, reportPath, reviewPath });
  }

  return writes;
}
