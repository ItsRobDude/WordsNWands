import type { ActiveEncounterSnapshotPayload } from "../../../../../packages/game-rules/src/index.ts";

import {
  createDefaultPlayerProfileRecord,
  createDefaultPlayerSettingsRecord,
  type AppBootstrapState,
  type AppPersistenceGateway,
} from "./types.ts";

export const createInMemoryAppPersistence = (
  seed?: Partial<AppBootstrapState>,
): AppPersistenceGateway => {
  let bootstrap: AppBootstrapState = {
    profile:
      seed?.profile ??
      createDefaultPlayerProfileRecord("2026-04-11T00:00:00.000Z"),
    settings:
      seed?.settings ??
      createDefaultPlayerSettingsRecord("2026-04-11T00:00:00.000Z"),
    active_snapshot: seed?.active_snapshot ?? null,
  };

  return {
    async initialize(): Promise<void> {},
    async loadBootstrapState(): Promise<AppBootstrapState> {
      return structuredClone(bootstrap);
    },
    async saveProfile(profile): Promise<void> {
      bootstrap = {
        ...bootstrap,
        profile: structuredClone(profile),
      };
    },
    async saveSettings(settings): Promise<void> {
      bootstrap = {
        ...bootstrap,
        settings: structuredClone(settings),
      };
    },
    async saveActiveSnapshot(
      snapshot: ActiveEncounterSnapshotPayload | null,
    ): Promise<void> {
      bootstrap = {
        ...bootstrap,
        active_snapshot: snapshot ? structuredClone(snapshot) : null,
      };
    },
  };
};
