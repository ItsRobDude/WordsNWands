import type { BoardPosition, EncounterRuntimeState } from "./board.js";
import type {
  AppPrimarySurface,
  EncounterSessionTransition,
  StarterTutorialBlockState,
  StarterTutorialCueStage,
} from "./core.js";
import type { EncounterRestoreTarget } from "./encounter.js";

export interface AppStoreState {
  sessionSlice: SessionSliceState;
  encounterSlice: EncounterSliceState;
  settingsSlice: SettingsSliceState;
  uiSlice: UiSliceState;
}

export interface SessionSliceState {
  app_session_id: string;
  app_primary_surface: AppPrimarySurface;
  encounter_restore_target: EncounterRestoreTarget;
  active_encounter_session_id: string | null;
  active_encounter_id: string | null;
  active_result_record_id: string | null;
  starter_tutorial_cue_stage: StarterTutorialCueStage;
  starter_tutorial_block_state: StarterTutorialBlockState;
  has_completed_starter_encounter: 0 | 1;
  last_route_change_at_utc: string;
}

export interface EncounterSliceState {
  runtime_state: EncounterRuntimeState | null;
  last_engine_transition: EncounterSessionTransition | null;
  pending_persist_write: 0 | 1;
  last_persisted_snapshot_updated_at_utc: string | null;
}

export interface SettingsSliceState {
  sfx_enabled: 0 | 1;
  music_enabled: 0 | 1;
  haptics_enabled: 0 | 1;
  reduce_motion_enabled: 0 | 1;
  locale_code: string;
  analytics_opt_in: 0 | 1;
  has_seen_settings_education: 0 | 1;
}

export interface UiSliceState {
  swipe_preview_path: BoardPosition[];
  highlighted_word_preview: string;
  transient_banner:
    | "none"
    | "invalid_word"
    | "repeated_word"
    | "countdown_warning"
    | "recoverable_error";
  pause_overlay_open: 0 | 1;
  result_ack_pending: 0 | 1;
}
