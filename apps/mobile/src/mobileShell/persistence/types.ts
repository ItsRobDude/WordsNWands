import type { ActiveEncounterSnapshotPayload } from "../../../../../packages/game-rules/src/index.ts";
import type {
  PlayerProfileRecord,
  PlayerSettingsRecord,
} from "../../../../../packages/game-rules/src/contracts/persistence.ts";

export interface AppBootstrapState {
  profile: PlayerProfileRecord;
  settings: PlayerSettingsRecord;
  active_snapshot: ActiveEncounterSnapshotPayload | null;
}

export interface AppPersistenceGateway {
  initialize(): Promise<void>;
  loadBootstrapState(): Promise<AppBootstrapState>;
  saveProfile(profile: PlayerProfileRecord): Promise<void>;
  saveSettings(settings: PlayerSettingsRecord): Promise<void>;
  saveActiveSnapshot(
    snapshot: ActiveEncounterSnapshotPayload | null,
  ): Promise<void>;
}

export const DEFAULT_PLAYER_PROFILE_ID = "local_player_001";

export const createDefaultPlayerProfileRecord = (
  updated_at_utc: string,
): PlayerProfileRecord => ({
  player_profile_id: DEFAULT_PLAYER_PROFILE_ID,
  has_completed_starter_encounter: 0,
  starter_result_outcome: null,
  cosmetic_currency_balance: 0,
  cosmetic_unlock_records_json: "[]",
  starter_tutorial_completed_stages_json: "[]",
  starter_tutorial_current_stage: "cue_01_trace_word",
  updated_at_utc,
});

export const createDefaultPlayerSettingsRecord = (
  updated_at_utc: string,
): PlayerSettingsRecord => ({
  player_profile_id: DEFAULT_PLAYER_PROFILE_ID,
  sfx_enabled: 1,
  music_enabled: 1,
  haptics_enabled: 1,
  reduce_motion_enabled: 0,
  locale_code: "en-US",
  analytics_opt_in: 0,
  has_seen_settings_education: 0,
  updated_at_utc,
});
