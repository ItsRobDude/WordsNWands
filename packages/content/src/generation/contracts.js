import fs from 'node:fs';

const REQUEST_MODES = new Set(['draft_generate_freeze_v1', 'runtime_seeded_trial_v1']);
const TARGET_TIERS = new Set(['gentle', 'standard', 'challenging', 'boss', 'event']);
const FAIL_RATE_BANDS = new Set(['low', 'medium', 'high']);
const OUTPUT_SCOPES = new Set(['draft_only', 'draft_and_freeze_candidate']);

export function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function validateRequestShape(request) {
  const requiredStringFields = [
    'request_id',
    'generator_version',
    'generator_mode',
    'generation_seed',
    'content_version_target',
    'validation_snapshot_version_target',
    'battle_rules_version_target',
    'board_generator_version_target',
    'target_tier',
    'target_fail_rate_band',
    'output_scope'
  ];

  for (const field of requiredStringFields) {
    if (typeof request[field] !== 'string' || request[field].trim().length === 0) {
      throw new Error(`Request validation failed: ${field} must be a non-empty string.`);
    }
  }

  if (request.generator_version !== 'structured_generation_v1') {
    throw new Error(`Request validation failed: generator_version must be structured_generation_v1.`);
  }
  if (!REQUEST_MODES.has(request.generator_mode)) {
    throw new Error(`Request validation failed: unsupported generator_mode ${request.generator_mode}.`);
  }
  if (!TARGET_TIERS.has(request.target_tier)) {
    throw new Error(`Request validation failed: unsupported target_tier ${request.target_tier}.`);
  }
  if (!FAIL_RATE_BANDS.has(request.target_fail_rate_band)) {
    throw new Error(`Request validation failed: unsupported target_fail_rate_band ${request.target_fail_rate_band}.`);
  }
  if (!OUTPUT_SCOPES.has(request.output_scope)) {
    throw new Error(`Request validation failed: unsupported output_scope ${request.output_scope}.`);
  }
  if (!/^[0-9a-f]{32}$/.test(request.generation_seed)) {
    throw new Error('Request validation failed: generation_seed must be 32 lowercase hex chars.');
  }

  if (!Number.isInteger(request.encounter_count) || request.encounter_count < 1 || request.encounter_count > 12) {
    throw new Error('Request validation failed: encounter_count must be an integer in [1, 12].');
  }

  validateStringArray(request.habitat_pool_ids, 'habitat_pool_ids');
  validateStringArray(request.blueprint_ids, 'blueprint_ids');
  validateStringArray(request.board_profile_ids, 'board_profile_ids');

  if (typeof request.allow_name_generation_from_bank !== 'boolean') {
    throw new Error('Request validation failed: allow_name_generation_from_bank must be boolean.');
  }
  if (typeof request.allow_flavor_generation_from_bank !== 'boolean') {
    throw new Error('Request validation failed: allow_flavor_generation_from_bank must be boolean.');
  }

  return request;
}

function validateStringArray(value, field) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.length === 0)) {
    throw new Error(`Request validation failed: ${field} must be a non-empty string array.`);
  }
}
