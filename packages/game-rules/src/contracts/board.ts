import type {
  DifficultyTier,
  ElementType,
  EncounterSessionState,
  EncounterTerminalReasonCode,
  EncounterType,
  TileSpecialMarkerKind,
  TileStateKind,
} from "./core.js";

export interface BoardPosition {
  row: number;
  col: number;
}

export interface BoardTile {
  id: string;
  letter: string;
  position: BoardPosition;
  state: TileStateKind | null;
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
  spark_shuffle_retry_count: number;
  updated_at_utc: string;
}
