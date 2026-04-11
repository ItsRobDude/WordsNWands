export type EncounterGenerationMode =
  | 'draft_generate_freeze_v1'
  | 'runtime_seeded_trial_v1';

export type GeneratorTargetTier =
  | 'gentle'
  | 'standard'
  | 'challenging'
  | 'boss'
  | 'event';

export type GeneratorTargetFailRateBand = 'low' | 'medium' | 'high';

export interface EncounterGenerationRequest {
  request_id: string;
  generator_version: 'structured_generation_v1';
  generator_mode: EncounterGenerationMode;
  generation_seed: string;
  content_version_target: string;
  validation_snapshot_version_target: string;
  battle_rules_version_target: string;
  board_generator_version_target: string;
  encounter_count: number;
  habitat_pool_ids: string[];
  blueprint_ids: string[];
  target_tier: GeneratorTargetTier;
  target_fail_rate_band: GeneratorTargetFailRateBand;
  board_profile_ids: string[];
  allow_name_generation_from_bank: boolean;
  allow_flavor_generation_from_bank: boolean;
  output_scope: 'draft_only' | 'draft_and_freeze_candidate';
}

export interface EncounterArchetypeBlueprint {
  blueprint_id: string;
  display_label: string;
  allowed_tiers: GeneratorTargetTier[];
  encounter_type: 'standard' | 'boss' | 'event';
  pressure_style:
    | 'soft_nuisance'
    | 'board_reorder'
    | 'temporary_blockage'
    | 'element_disruption'
    | 'boss_escalation';
  spell_identity: string;
  allowed_spell_payloads: SpellPayloadTemplateRef[];
  allowed_matchup_pair_pool_ids: string[];
  allowed_habitat_tags: string[];
  profile_overrides: BlueprintBalanceProfileOverride;
  prohibited_combination_flags: string[];
}

export interface SpellPayloadTemplateRef {
  template_id: string;
  primitive_kind: 'apply_tile_state' | 'shift_row' | 'shift_column' | 'chained';
}

export interface BlueprintBalanceProfileOverride {
  weakness_hit_rate_delta: number;
  wand_incidence_delta: number;
  soot_exposure_delta: number;
  target_casts_to_defeat_delta: number;
  target_spell_count_on_win_delta: number;
}

export interface RuntimeValidationFinding {
  code: string;
  message: string;
  severity: 'info' | 'warn' | 'error';
  json_path?: string;
}

export type RuntimeEncounterDefinition = Record<string, unknown>;

export type RuntimeCreatureDefinition = Record<string, unknown>;

export interface GeneratedEncounterDraftArtifact {
  draft_id: string;
  request_id: string;
  generator_version: 'structured_generation_v1';
  generator_mode: EncounterGenerationMode;
  generation_seed: string;
  blueprint_id: string;
  target_tier: GeneratorTargetTier;
  content_version_target: string;
  validation_snapshot_version_target: string;
  battle_rules_version_target: string;
  board_generator_version_target: string;
  encounter_definition: RuntimeEncounterDefinition;
  creature_definition: RuntimeCreatureDefinition | null;
  review_summary: GeneratedEncounterReviewSummary;
  balance_report: GeneratedEncounterBalanceReport;
}

export interface GeneratedEncounterReviewSummary {
  habitat_theme_id: string;
  habitat_display_name: string;
  creature_display_name: string;
  weakness: string;
  resistance: string;
  move_budget: number;
  base_countdown: number;
  max_hp: number;
  spell_identity: string;
  why_it_should_feel_fair: string;
  why_it_matches_wordsnwands: string;
}

export interface GeneratedEncounterBalanceReport {
  expected_profile: {
    avg_word_length: number;
    weakness_hit_rate: number;
    wand_incidence: number;
    soot_exposure: number;
  };
  derived_values: {
    expected_damage_per_cast: number;
    target_casts_to_defeat: number;
    target_spell_count_on_win: number;
    derived_hp: number;
    derived_move_budget: number;
    derived_base_countdown: number;
  };
  validator_findings: RuntimeValidationFinding[];
  guardrail_status: 'pass' | 'warn' | 'error';
}
