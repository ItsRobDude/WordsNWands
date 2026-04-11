import type {
  DifficultyTier,
  ElementType,
  EncounterSessionState,
  EncounterTerminalReasonCode,
  EncounterType,
  TileSpecialMarkerKind,
  TileStateKind,
} from "./core.js";

export type SparkShuffleFallbackOutcome =
  | "none"
  | "deterministic_emergency_regen"
  | "recoverable_error_end";

export interface EncounterVersionPins {
  content_version_pin: string;
  validation_snapshot_version_pin: string;
  battle_rules_version_pin: string;
  board_generator_version_pin: string;
  reward_constants_version_pin: string;
}

export const DEFAULT_SPARK_SHUFFLE_RETRY_CAP = 3 as const;

export const DEFAULT_ENCOUNTER_VERSION_PINS: EncounterVersionPins = {
  content_version_pin: "content_version_unpinned",
  validation_snapshot_version_pin: "validation_snapshot_unpinned",
  battle_rules_version_pin: "battle_rules_unpinned",
  board_generator_version_pin: "board_generator_unpinned",
  reward_constants_version_pin: "reward_constants_unpinned",
};

export interface BoardPosition {
  row: number;
  col: number;
}

export interface BoardTile {
  id: string;
  letter: string;
  position: BoardPosition;
  state: TileStateKind | null;
  state_turns_remaining?: number | null;
  special_marker: TileSpecialMarkerKind | null;
}

export interface EncounterRngStreamStates {
  board_fill_stream_state: string;
  creature_spell_stream_state: string;
  spark_shuffle_stream_state: string;
}

export interface BoardSnapshot {
  width: number;
  height: number;
  tiles: BoardTile[];
  rng_stream_states: EncounterRngStreamStates;
}

export interface CreatureRuntimeState {
  creature_id: string;
  display_name: string;
  encounter_type: EncounterType;
  difficulty_tier: DifficultyTier;
  weakness_element: ElementType;
  resistance_element: ElementType;
  hp_current: number;
  hp_max: number;
  spell_countdown_current: number;
  spell_countdown_reset: number;
}

export interface EncounterRuntimeState {
  encounter_session_id: string;
  encounter_id: string;
  encounter_seed: string;
  board: BoardSnapshot;
  creature: CreatureRuntimeState;
  session_state: EncounterSessionState;
  terminal_reason_code: EncounterTerminalReasonCode | null;
  moves_remaining: number;
  move_budget_total: number;
  repeated_words: string[];
  casts_resolved_count: number;
  spark_shuffle_retry_cap: number;
  spark_shuffle_retries_attempted: number;
  spark_shuffle_fallback_outcome: SparkShuffleFallbackOutcome;
  content_version_pin: string;
  validation_snapshot_version_pin: string;
  battle_rules_version_pin: string;
  board_generator_version_pin: string;
  reward_constants_version_pin: string;
  damage_model_version: "damage_model_v1";
  updated_at_utc: string;
}
