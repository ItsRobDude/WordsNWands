import type {
  EncounterOutcome,
  EncounterSessionState,
  EncounterTerminalReasonCode,
  EncounterType,
  StarterTutorialCueStage,
} from "./core.js";

export interface PlayerProfileRecord {
  player_profile_id: string;
  has_completed_starter_encounter: 0 | 1;
  starter_result_outcome: EncounterOutcome | null;
  cosmetic_currency_balance: number;
  cosmetic_unlock_records_json: string;
  starter_tutorial_completed_stages_json: string;
  starter_tutorial_current_stage: StarterTutorialCueStage;
  updated_at_utc: string;
}

export interface PlayerSettingsRecord {
  player_profile_id: string;
  sfx_enabled: 0 | 1;
  music_enabled: 0 | 1;
  haptics_enabled: 0 | 1;
  reduce_motion_enabled: 0 | 1;
  locale_code: string;
  analytics_opt_in: 0 | 1;
  has_seen_settings_education: 0 | 1;
  updated_at_utc: string;
}

export interface EncounterProgressRecord {
  encounter_id: string;
  is_unlocked: 0 | 1;
  best_star_rating: 0 | 1 | 2 | 3;
  win_count: number;
  loss_count: number;
  first_unlocked_at_utc: string | null;
  first_completed_at_utc: string | null;
  last_completed_at_utc: string | null;
  updated_at_utc: string;
}

export interface EncounterResultRecord {
  result_id: string;
  encounter_session_id: string;
  encounter_id: string;
  encounter_type: EncounterType;
  outcome: EncounterOutcome;
  terminal_reason_code: EncounterTerminalReasonCode;
  star_rating: 0 | 1 | 2 | 3;
  moves_remaining: number;
  move_budget_total: number;
  completed_at_utc: string;
}

export interface ActiveEncounterSnapshotRecord {
  encounter_session_id: string;
  encounter_id: string;
  encounter_type: EncounterType;
  session_state: EncounterSessionState;
  terminal_reason_code: EncounterTerminalReasonCode | null;
  runtime_state_json: string;
  active_assist_state_json: string | null;
  last_persisted_at_utc: string;
}
