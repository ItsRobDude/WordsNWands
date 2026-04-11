import fs from 'node:fs';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { generateFromRequestFile } from './generateEncounters.js';

const requestPath = path.join(os.tmpdir(), 'deterministic-request.json');

const baseRequest = {
  request_id: 'req_deterministic_001',
  generator_version: 'structured_generation_v1',
  generator_mode: 'draft_generate_freeze_v1',
  generation_seed: 'fedcba9876543210fedcba9876543210',
  content_version_target: 'content_v0_draft',
  validation_snapshot_version_target: 'validation_snapshot_v1',
  battle_rules_version_target: 'battle_rules_v1',
  board_generator_version_target: 'board_generator_v1',
  encounter_count: 1,
  habitat_pool_ids: ['habitat_pool_meadow_and_brook_v1'],
  blueprint_ids: ['soot_standard_v1', 'shift_row_standard_v1'],
  target_tier: 'standard',
  target_fail_rate_band: 'medium',
  board_profile_ids: ['board_profile_core_mainline_v1'],
  allow_name_generation_from_bank: true,
  allow_flavor_generation_from_bank: true,
  output_scope: 'draft_only'
};

function loadReport(reportPath) {
  return JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
}

test('encounter generation is deterministic for identical request and seed', () => {
  fs.writeFileSync(requestPath, JSON.stringify(baseRequest, null, 2));
  const first = generateFromRequestFile(requestPath);
  const second = generateFromRequestFile(requestPath);

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);

  const firstReport = loadReport(first[0].reportPath);
  const secondReport = loadReport(second[0].reportPath);
  assert.deepEqual(firstReport, secondReport);
});

test('illegal request fails with explicit request schema finding', () => {
  const badRequestPath = path.join(os.tmpdir(), `bad-request-${Date.now()}.json`);
  const invalidRequest = {
    request_id: 'req_bad_001',
    generator_version: 'structured_generation_v1',
    generator_mode: 'draft_generate_freeze_v1',
    generation_seed: 'invalid-seed',
    content_version_target: 'content_v0_draft',
    validation_snapshot_version_target: 'validation_snapshot_v1',
    battle_rules_version_target: 'battle_rules_v1',
    board_generator_version_target: 'board_generator_v1',
    encounter_count: 1,
    habitat_pool_ids: ['habitat_pool_meadow_and_brook_v1'],
    blueprint_ids: ['soot_standard_v1'],
    target_tier: 'standard',
    target_fail_rate_band: 'medium',
    board_profile_ids: ['board_profile_core_mainline_v1'],
    allow_name_generation_from_bank: true,
    allow_flavor_generation_from_bank: true,
    output_scope: 'draft_only'
  };
  fs.writeFileSync(badRequestPath, JSON.stringify(invalidRequest, null, 2));

  assert.throws(
    () => generateFromRequestFile(badRequestPath),
    /request schema pass[\s\S]*REQUEST_SCHEMA[\s\S]*generation_seed/
  );
});

test('duplicate batch sanity emits warnings for overused blueprint/matchup/spell identity', () => {
  const duplicateRequestPath = path.join(os.tmpdir(), `duplicate-request-${Date.now()}.json`);
  const duplicateRequest = {
    request_id: 'req_duplicate_001',
    generator_version: 'structured_generation_v1',
    generator_mode: 'draft_generate_freeze_v1',
    generation_seed: 'abcdef0123456789abcdef0123456789',
    content_version_target: 'content_v0_draft',
    validation_snapshot_version_target: 'validation_snapshot_v1',
    battle_rules_version_target: 'battle_rules_v1',
    board_generator_version_target: 'board_generator_v1',
    encounter_count: 4,
    habitat_pool_ids: ['habitat_pool_meadow_and_brook_v1'],
    blueprint_ids: ['soot_standard_v1'],
    target_tier: 'standard',
    target_fail_rate_band: 'medium',
    board_profile_ids: ['board_profile_core_mainline_v1'],
    allow_name_generation_from_bank: true,
    allow_flavor_generation_from_bank: true,
    output_scope: 'draft_only'
  };
  fs.writeFileSync(duplicateRequestPath, JSON.stringify(duplicateRequest, null, 2));

  const outputs = generateFromRequestFile(duplicateRequestPath);
  assert.equal(outputs.length, 4);

  const reports = outputs.map((output) => loadReport(output.reportPath));
  assert.ok(reports.some((report) => report.balance_report.guardrail_status === 'warn'));

  const allWarningCodes = new Set(
    reports.flatMap((report) => report.balance_report.validator_findings.map((finding) => finding.code))
  );
  assert.ok(allWarningCodes.has('DBS-BLUEPRINT-001'));
  assert.ok(allWarningCodes.has('DBS-MATCHUP-001'));
  assert.ok(allWarningCodes.has('DBS-SPELL-001'));
});
