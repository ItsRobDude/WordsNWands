import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import type { ActiveEncounterSnapshotPayload } from "../../../../../packages/game-rules/src/index.ts";
import type {
  PlayerProfileRecord,
  PlayerSettingsRecord,
} from "../../../../../packages/game-rules/src/contracts/persistence.ts";

import {
  createDefaultPlayerProfileRecord,
  createDefaultPlayerSettingsRecord,
  DEFAULT_PLAYER_PROFILE_ID,
  type AppBootstrapState,
  type AppPersistenceGateway,
} from "./types.ts";

const DATABASE_NAME = "words-n-wands.db";

export const createSQLiteAppPersistence = (): AppPersistenceGateway => {
  let database_promise: Promise<SQLiteDatabase> | null = null;

  const getDatabase = async (): Promise<SQLiteDatabase> => {
    if (!database_promise) {
      database_promise = openDatabaseAsync(DATABASE_NAME);
    }

    return database_promise;
  };

  return {
    async initialize(): Promise<void> {
      const database = await getDatabase();
      await database.execAsync(
        [
          "CREATE TABLE IF NOT EXISTS player_profile_records (",
          "  player_profile_id TEXT PRIMARY KEY NOT NULL,",
          "  has_completed_starter_encounter INTEGER NOT NULL,",
          "  starter_result_outcome TEXT NULL,",
          "  cosmetic_currency_balance INTEGER NOT NULL,",
          "  cosmetic_unlock_records_json TEXT NOT NULL,",
          "  starter_tutorial_completed_stages_json TEXT NOT NULL,",
          "  starter_tutorial_current_stage TEXT NOT NULL,",
          "  updated_at_utc TEXT NOT NULL",
          ");",
          "CREATE TABLE IF NOT EXISTS player_settings_records (",
          "  player_profile_id TEXT PRIMARY KEY NOT NULL,",
          "  sfx_enabled INTEGER NOT NULL,",
          "  music_enabled INTEGER NOT NULL,",
          "  haptics_enabled INTEGER NOT NULL,",
          "  reduce_motion_enabled INTEGER NOT NULL,",
          "  locale_code TEXT NOT NULL,",
          "  analytics_opt_in INTEGER NOT NULL,",
          "  has_seen_settings_education INTEGER NOT NULL,",
          "  updated_at_utc TEXT NOT NULL",
          ");",
          "CREATE TABLE IF NOT EXISTS active_encounter_snapshots (",
          "  encounter_session_id TEXT PRIMARY KEY NOT NULL,",
          "  encounter_id TEXT NOT NULL,",
          "  encounter_type TEXT NOT NULL,",
          "  session_state TEXT NOT NULL,",
          "  terminal_reason_code TEXT NULL,",
          "  runtime_state_json TEXT NOT NULL,",
          "  active_assist_state_json TEXT NULL,",
          "  last_persisted_at_utc TEXT NOT NULL",
          ");",
        ].join("\n"),
      );
    },

    async loadBootstrapState(): Promise<AppBootstrapState> {
      const database = await getDatabase();
      const now = new Date().toISOString();

      let profile = await database.getFirstAsync<PlayerProfileRecord>(
        "SELECT * FROM player_profile_records WHERE player_profile_id = ?",
        DEFAULT_PLAYER_PROFILE_ID,
      );

      if (!profile) {
        profile = createDefaultPlayerProfileRecord(now);
        await saveProfileRecord(database, profile);
      }

      let settings = await database.getFirstAsync<PlayerSettingsRecord>(
        "SELECT * FROM player_settings_records WHERE player_profile_id = ?",
        DEFAULT_PLAYER_PROFILE_ID,
      );

      if (!settings) {
        settings = createDefaultPlayerSettingsRecord(now);
        await saveSettingsRecord(database, settings);
      }

      const active_snapshot =
        await database.getFirstAsync<ActiveEncounterSnapshotPayload>(
          "SELECT * FROM active_encounter_snapshots ORDER BY last_persisted_at_utc DESC LIMIT 1",
        );

      return {
        profile,
        settings,
        active_snapshot,
      };
    },

    async saveProfile(profile): Promise<void> {
      const database = await getDatabase();
      await saveProfileRecord(database, profile);
    },

    async saveSettings(settings): Promise<void> {
      const database = await getDatabase();
      await saveSettingsRecord(database, settings);
    },

    async saveActiveSnapshot(
      snapshot: ActiveEncounterSnapshotPayload | null,
    ): Promise<void> {
      const database = await getDatabase();
      await database.withExclusiveTransactionAsync(async (txn) => {
        await txn.execAsync("DELETE FROM active_encounter_snapshots");

        if (!snapshot) {
          return;
        }

        await txn.runAsync(
          [
            "INSERT INTO active_encounter_snapshots (",
            "  encounter_session_id,",
            "  encounter_id,",
            "  encounter_type,",
            "  session_state,",
            "  terminal_reason_code,",
            "  runtime_state_json,",
            "  active_assist_state_json,",
            "  last_persisted_at_utc",
            ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          ].join("\n"),
          snapshot.encounter_session_id,
          snapshot.encounter_id,
          snapshot.encounter_type,
          snapshot.session_state,
          snapshot.terminal_reason_code,
          snapshot.runtime_state_json,
          snapshot.active_assist_state_json,
          snapshot.last_persisted_at_utc,
        );
      });
    },
  };
};

const saveProfileRecord = async (
  database: SQLiteDatabase,
  profile: PlayerProfileRecord,
): Promise<void> => {
  await database.runAsync(
    [
      "INSERT OR REPLACE INTO player_profile_records (",
      "  player_profile_id,",
      "  has_completed_starter_encounter,",
      "  starter_result_outcome,",
      "  cosmetic_currency_balance,",
      "  cosmetic_unlock_records_json,",
      "  starter_tutorial_completed_stages_json,",
      "  starter_tutorial_current_stage,",
      "  updated_at_utc",
      ") VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    ].join("\n"),
    profile.player_profile_id,
    profile.has_completed_starter_encounter,
    profile.starter_result_outcome,
    profile.cosmetic_currency_balance,
    profile.cosmetic_unlock_records_json,
    profile.starter_tutorial_completed_stages_json,
    profile.starter_tutorial_current_stage,
    profile.updated_at_utc,
  );
};

const saveSettingsRecord = async (
  database: SQLiteDatabase,
  settings: PlayerSettingsRecord,
): Promise<void> => {
  await database.runAsync(
    [
      "INSERT OR REPLACE INTO player_settings_records (",
      "  player_profile_id,",
      "  sfx_enabled,",
      "  music_enabled,",
      "  haptics_enabled,",
      "  reduce_motion_enabled,",
      "  locale_code,",
      "  analytics_opt_in,",
      "  has_seen_settings_education,",
      "  updated_at_utc",
      ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ].join("\n"),
    settings.player_profile_id,
    settings.sfx_enabled,
    settings.music_enabled,
    settings.haptics_enabled,
    settings.reduce_motion_enabled,
    settings.locale_code,
    settings.analytics_opt_in,
    settings.has_seen_settings_education,
    settings.updated_at_utc,
  );
};
