import { createStore, type StoreApi } from "zustand/vanilla";

import {
  type ActiveEncounterSnapshotPayload,
  type BoardPosition,
  type EncounterRuntimeState,
  type HeadlessTranscriptEntry,
  serializeActiveEncounterSnapshot,
} from "../../../../../packages/game-rules/src/index.ts";
import {
  applyTraceSelectionPayload,
  applyTapSelectionPosition,
  clearBoardSelectionCandidate,
  commitBoardSelectionCandidate,
  createEmptyBoardSelectionCandidate,
  extendBoardSelectionCandidate,
  startBoardSelectionCandidate,
  type BoardSelectionCandidate,
  type CastTracePayload,
  type TraceBoardBounds,
} from "../../../../../packages/game-rules/src/input/boardSelection.ts";
import type {
  AppStoreState,
  EncounterSliceState,
  SessionSliceState,
  SettingsSliceState,
  UiSliceState,
} from "../../../../../packages/game-rules/src/contracts/appStore.ts";
import type {
  AppPrimarySurface,
  EncounterSessionTransition,
} from "../../../../../packages/game-rules/src/contracts/core.ts";
import type {
  PlayerProfileRecord,
  PlayerSettingsRecord,
} from "../../../../../packages/game-rules/src/contracts/persistence.ts";

import {
  applySelectionToEncounterRuntime,
  createFreshEncounterRuntime,
  deriveWordPreviewFromSelection,
  getPrimaryChapter,
  getStarterEncounterId,
  restorePersistedEncounterRuntime,
  type ActiveEncounterContext,
} from "../../verticalSlice/encounterRuntime.ts";
import type { BundledContentRuntime } from "../../../../../packages/content/src/runtime/createBundledContentRuntime.ts";
import type { AppPersistenceGateway } from "../persistence/types.ts";

export interface MobileSliceState {
  hydration_status: "idle" | "loading" | "ready" | "error";
  hydration_error_message: string | null;
  profile_record: PlayerProfileRecord | null;
  settings_record: PlayerSettingsRecord | null;
  active_encounter_context: ActiveEncounterContext | null;
  attempts_by_encounter: Record<string, number>;
  completed_encounter_ids: string[];
  last_transcript_entry: HeadlessTranscriptEntry | null;
  input_candidate: BoardSelectionCandidate;
}

export interface MobileAppStoreState extends AppStoreState {
  mobileSlice: MobileSliceState;
  actions: MobileAppStoreActions;
}

export interface MobileAppStoreActions {
  initialize(): Promise<void>;
  launchEncounter(encounterId: string): Promise<void>;
  resumeEncounter(): void;
  openPauseMenu(): void;
  closePauseMenu(): void;
  restartEncounter(): Promise<void>;
  startTraceSelection(position: BoardPosition): void;
  extendTraceSelection(position: BoardPosition): void;
  cancelTraceSelection(): void;
  selectBoardPosition(position: BoardPosition): void;
  applyTraceSelection(
    payload: CastTracePayload,
    bounds: TraceBoardBounds,
  ): Promise<void>;
  clearSelection(): void;
  submitSelection(): Promise<void>;
  leaveEncounter(): void;
  advanceFromResult(): Promise<void>;
  returnFromResult(): Promise<void>;
  setSurface(surface: AppPrimarySurface): void;
}

export const createMobileAppStore = (input: {
  persistence: AppPersistenceGateway;
  content: BundledContentRuntime;
}): StoreApi<MobileAppStoreState> =>
  createStore<MobileAppStoreState>((set, get, store) => ({
    sessionSlice: createInitialSessionSlice(),
    encounterSlice: createInitialEncounterSlice(),
    settingsSlice: createInitialSettingsSlice(),
    uiSlice: createInitialUiSlice(),
    mobileSlice: {
      hydration_status: "idle",
      hydration_error_message: null,
      profile_record: null,
      settings_record: null,
      active_encounter_context: null,
      attempts_by_encounter: {},
      completed_encounter_ids: [],
      last_transcript_entry: null,
      input_candidate: createEmptyBoardSelectionCandidate(),
    },
    actions: {
      async initialize(): Promise<void> {
        if (get().mobileSlice.hydration_status === "loading") {
          return;
        }

        set((state) => ({
          ...state,
          mobileSlice: {
            ...state.mobileSlice,
            hydration_status: "loading",
            hydration_error_message: null,
          },
        }));

        try {
          await input.persistence.initialize();
          const bootstrap = await input.persistence.loadBootstrapState();

          const restoredState = deriveBootState({
            content: input.content,
            profile: bootstrap.profile,
            settings: bootstrap.settings,
            active_snapshot: bootstrap.active_snapshot,
          });

          set((state) => ({
            ...state,
            sessionSlice: restoredState.sessionSlice,
            encounterSlice: restoredState.encounterSlice,
            settingsSlice: restoredState.settingsSlice,
            uiSlice: restoredState.uiSlice,
            mobileSlice: {
              ...state.mobileSlice,
              hydration_status: "ready",
              hydration_error_message: null,
              profile_record: bootstrap.profile,
              settings_record: bootstrap.settings,
              active_encounter_context:
                restoredState.mobileSlice.active_encounter_context,
              attempts_by_encounter:
                restoredState.mobileSlice.attempts_by_encounter,
              completed_encounter_ids:
                restoredState.mobileSlice.completed_encounter_ids,
              last_transcript_entry: null,
              input_candidate: createEmptyBoardSelectionCandidate(),
            },
          }));
        } catch (error) {
          set((state) => ({
            ...state,
            mobileSlice: {
              ...state.mobileSlice,
              hydration_status: "error",
              hydration_error_message:
                error instanceof Error ? error.message : String(error),
            },
          }));
        }
      },

      async launchEncounter(encounterId: string): Promise<void> {
        const currentAttempts =
          get().mobileSlice.attempts_by_encounter[encounterId];
        const attemptNumber = (currentAttempts ?? 0) + 1;
        const created = createFreshEncounterRuntime({
          content: input.content,
          encounter_id: encounterId,
          attempt_number: attemptNumber,
        });

        set((state) => ({
          ...state,
          sessionSlice: {
            ...state.sessionSlice,
            app_primary_surface: "encounter",
            encounter_restore_target: {
              surface: "encounter",
              encounter_session_id: created.runtime_state.encounter_session_id,
              encounter_id: created.runtime_state.encounter_id,
              result_record_id: null,
            },
            active_encounter_session_id:
              created.runtime_state.encounter_session_id,
            active_encounter_id: created.runtime_state.encounter_id,
            active_result_record_id: null,
            has_completed_starter_encounter:
              state.sessionSlice.has_completed_starter_encounter,
            last_route_change_at_utc: nowUtcIso(),
          },
          encounterSlice: {
            runtime_state: created.runtime_state,
            last_engine_transition: "open_encounter",
            pending_persist_write: 1,
            last_persisted_snapshot_updated_at_utc: null,
          },
          uiSlice: createInitialUiSlice(),
          mobileSlice: {
            ...state.mobileSlice,
            active_encounter_context: created.context,
            attempts_by_encounter: {
              ...state.mobileSlice.attempts_by_encounter,
              [encounterId]: attemptNumber,
            },
            last_transcript_entry: null,
            input_candidate: createEmptyBoardSelectionCandidate(),
          },
        }));

        await persistSnapshotIfNeeded({
          store,
          persistence: input.persistence,
        });
      },

      resumeEncounter(): void {
        const runtimeState = get().encounterSlice.runtime_state;
        if (!runtimeState) {
          return;
        }

        set((state) => ({
          ...state,
          sessionSlice: {
            ...state.sessionSlice,
            app_primary_surface:
              runtimeState.session_state === "won" ||
              runtimeState.session_state === "lost" ||
              runtimeState.session_state === "recoverable_error"
                ? "result"
                : "encounter",
            last_route_change_at_utc: nowUtcIso(),
          },
          uiSlice: {
            ...state.uiSlice,
            pause_overlay_open: 0,
          },
        }));
      },

      openPauseMenu(): void {
        set((state) => ({
          ...state,
          uiSlice: {
            ...state.uiSlice,
            pause_overlay_open: 1,
          },
        }));
      },

      closePauseMenu(): void {
        set((state) => ({
          ...state,
          uiSlice: {
            ...state.uiSlice,
            pause_overlay_open: 0,
          },
        }));
      },

      async restartEncounter(): Promise<void> {
        const encounterId = get().encounterSlice.runtime_state?.encounter_id;
        if (!encounterId) {
          return;
        }

        await get().actions.launchEncounter(encounterId);
      },

      startTraceSelection(position: BoardPosition): void {
        const state = get();
        const runtimeState = state.encounterSlice.runtime_state;
        if (!runtimeState || runtimeState.session_state !== "in_progress") {
          return;
        }

        const nextCandidate = startBoardSelectionCandidate(position);
        const highlightedWordPreview = deriveWordPreviewFromSelection({
          runtime_state: runtimeState,
          selected_positions: nextCandidate.selected_positions,
        });

        setPreviewCandidate({
          set,
          candidate: nextCandidate,
          highlighted_word_preview: highlightedWordPreview,
        });
      },

      extendTraceSelection(position: BoardPosition): void {
        const state = get();
        const runtimeState = state.encounterSlice.runtime_state;
        if (!runtimeState || runtimeState.session_state !== "in_progress") {
          return;
        }

        const nextCandidate = extendBoardSelectionCandidate({
          candidate: state.mobileSlice.input_candidate,
          position,
        });
        const highlightedWordPreview = deriveWordPreviewFromSelection({
          runtime_state: runtimeState,
          selected_positions: nextCandidate.selected_positions,
        });

        setPreviewCandidate({
          set,
          candidate: nextCandidate,
          highlighted_word_preview: highlightedWordPreview,
        });
      },

      cancelTraceSelection(): void {
        set((state) => ({
          ...state,
          uiSlice: {
            ...state.uiSlice,
            swipe_preview_path: [],
            highlighted_word_preview: "",
          },
          mobileSlice: {
            ...state.mobileSlice,
            input_candidate: clearBoardSelectionCandidate(),
          },
        }));
      },

      selectBoardPosition(position: BoardPosition): void {
        const state = get();
        const runtimeState = state.encounterSlice.runtime_state;
        if (!runtimeState || runtimeState.session_state !== "in_progress") {
          return;
        }

        const nextCandidate = applyTapSelectionPosition({
          candidate: state.mobileSlice.input_candidate,
          position,
        });
        const highlightedWordPreview = deriveWordPreviewFromSelection({
          runtime_state: runtimeState,
          selected_positions: nextCandidate.selected_positions,
        });

        setPreviewCandidate({
          set,
          candidate: nextCandidate,
          highlighted_word_preview: highlightedWordPreview,
        });
      },

      async applyTraceSelection(
        payload: CastTracePayload,
        bounds: TraceBoardBounds,
      ): Promise<void> {
        const state = get();
        const runtimeState = state.encounterSlice.runtime_state;
        if (!runtimeState || runtimeState.session_state !== "in_progress") {
          return;
        }

        const traced = applyTraceSelectionPayload({
          candidate: state.mobileSlice.input_candidate,
          payload,
          bounds,
        });
        const nextPreviewPositions =
          traced.committed_selection ?? traced.candidate.selected_positions;
        const highlightedWordPreview = deriveWordPreviewFromSelection({
          runtime_state: runtimeState,
          selected_positions: nextPreviewPositions,
        });

        setPreviewCandidate({
          set,
          candidate: traced.candidate,
          highlighted_word_preview: highlightedWordPreview,
        });

        if (!traced.committed_selection) {
          return;
        }

        await resolveCommittedSelection({
          store,
          persistence: input.persistence,
          content: input.content,
          selected_positions: traced.committed_selection,
        });
      },

      clearSelection(): void {
        set((state) => ({
          ...state,
          uiSlice: {
            ...state.uiSlice,
            swipe_preview_path: [],
            highlighted_word_preview: "",
          },
          mobileSlice: {
            ...state.mobileSlice,
            input_candidate: clearBoardSelectionCandidate(),
          },
        }));
      },

      async submitSelection(): Promise<void> {
        const state = get();
        const runtimeState = state.encounterSlice.runtime_state;
        const activeContext = state.mobileSlice.active_encounter_context;
        if (!runtimeState || !activeContext) {
          return;
        }

        const committed = commitBoardSelectionCandidate(
          state.mobileSlice.input_candidate,
        );

        set((current) => ({
          ...current,
          uiSlice: {
            ...current.uiSlice,
            swipe_preview_path: [],
            highlighted_word_preview: "",
          },
          mobileSlice: {
            ...current.mobileSlice,
            input_candidate: committed.candidate,
          },
        }));

        if (!committed.committed_selection) {
          return;
        }
        await resolveCommittedSelection({
          store,
          persistence: input.persistence,
          content: input.content,
          selected_positions: committed.committed_selection,
        });
      },

      leaveEncounter(): void {
        const nextSurface =
          get().sessionSlice.has_completed_starter_encounter === 1
            ? "home"
            : "starter_flow";

        set((state) => ({
          ...state,
          sessionSlice: {
            ...state.sessionSlice,
            app_primary_surface: nextSurface,
            last_route_change_at_utc: nowUtcIso(),
          },
          uiSlice: createInitialUiSlice(),
          mobileSlice: {
            ...state.mobileSlice,
            input_candidate: createEmptyBoardSelectionCandidate(),
          },
        }));
      },

      async advanceFromResult(): Promise<void> {
        const runtimeState = get().encounterSlice.runtime_state;
        if (!runtimeState) {
          get().actions.setSurface("home");
          return;
        }

        if (runtimeState.session_state === "won") {
          if (
            runtimeState.encounter_id === getStarterEncounterId(input.content)
          ) {
            await clearEncounterAfterResult({
              store,
              persistence: input.persistence,
              next_surface: "home",
            });
            await get().actions.launchEncounter(
              getPrimaryEncounterId(input.content),
            );
            return;
          }

          await clearEncounterAfterResult({
            store,
            persistence: input.persistence,
            next_surface: "home",
          });
          return;
        }

        await get().actions.launchEncounter(runtimeState.encounter_id);
      },

      async returnFromResult(): Promise<void> {
        const nextSurface =
          get().sessionSlice.has_completed_starter_encounter === 1
            ? "home"
            : "starter_flow";
        await clearEncounterAfterResult({
          store,
          persistence: input.persistence,
          next_surface: nextSurface,
        });
      },

      setSurface(surface: AppPrimarySurface): void {
        set((state) => ({
          ...state,
          sessionSlice: {
            ...state.sessionSlice,
            app_primary_surface: surface,
            last_route_change_at_utc: nowUtcIso(),
          },
          uiSlice: {
            ...state.uiSlice,
            pause_overlay_open: 0,
          },
        }));
      },
    },
  }));

const deriveBootState = (input: {
  content: BundledContentRuntime;
  profile: PlayerProfileRecord;
  settings: PlayerSettingsRecord;
  active_snapshot: ActiveEncounterSnapshotPayload | null;
}): Pick<
  MobileAppStoreState,
  | "sessionSlice"
  | "encounterSlice"
  | "settingsSlice"
  | "uiSlice"
  | "mobileSlice"
> => {
  if (input.active_snapshot) {
    const restored = restorePersistedEncounterRuntime({
      content: input.content,
      encounter_id: input.active_snapshot.encounter_id,
      runtime_state_json: input.active_snapshot.runtime_state_json,
      session_state: input.active_snapshot.session_state,
      terminal_reason_code: input.active_snapshot.terminal_reason_code,
      last_persisted_at_utc: input.active_snapshot.last_persisted_at_utc,
    });
    const appSurface = isTerminalState(restored.runtime_state)
      ? "result"
      : "encounter";

    return {
      sessionSlice: {
        app_session_id: createAppSessionId(),
        app_primary_surface: appSurface,
        encounter_restore_target: {
          surface: appSurface,
          encounter_session_id: restored.runtime_state.encounter_session_id,
          encounter_id: restored.runtime_state.encounter_id,
          result_record_id: null,
        },
        active_encounter_session_id:
          restored.runtime_state.encounter_session_id,
        active_encounter_id: restored.runtime_state.encounter_id,
        active_result_record_id: null,
        starter_tutorial_cue_stage:
          input.profile.starter_tutorial_current_stage,
        starter_tutorial_block_state: "none",
        has_completed_starter_encounter:
          input.profile.has_completed_starter_encounter,
        last_route_change_at_utc: nowUtcIso(),
      },
      encounterSlice: {
        runtime_state: restored.runtime_state,
        last_engine_transition: null,
        pending_persist_write: 0,
        last_persisted_snapshot_updated_at_utc:
          input.active_snapshot.last_persisted_at_utc,
      },
      settingsSlice: mapSettingsRecordToSlice(input.settings),
      uiSlice: {
        ...createInitialUiSlice(),
        result_ack_pending: isTerminalState(restored.runtime_state) ? 1 : 0,
      },
      mobileSlice: {
        hydration_status: "ready",
        hydration_error_message: null,
        profile_record: input.profile,
        settings_record: input.settings,
        active_encounter_context: restored.context,
        attempts_by_encounter: {
          [restored.runtime_state.encounter_id]:
            restored.context.attempt_number,
        },
        completed_encounter_ids:
          restored.runtime_state.session_state === "won"
            ? [restored.runtime_state.encounter_id]
            : [],
        last_transcript_entry: null,
        input_candidate: createEmptyBoardSelectionCandidate(),
      },
    };
  }

  const starterSurface =
    input.profile.has_completed_starter_encounter === 1
      ? "home"
      : "starter_flow";

  return {
    sessionSlice: {
      app_session_id: createAppSessionId(),
      app_primary_surface: starterSurface,
      encounter_restore_target: {
        surface: starterSurface,
        encounter_session_id: null,
        encounter_id: null,
        result_record_id: null,
      },
      active_encounter_session_id: null,
      active_encounter_id: null,
      active_result_record_id: null,
      starter_tutorial_cue_stage: input.profile.starter_tutorial_current_stage,
      starter_tutorial_block_state: "none",
      has_completed_starter_encounter:
        input.profile.has_completed_starter_encounter,
      last_route_change_at_utc: nowUtcIso(),
    },
    encounterSlice: createInitialEncounterSlice(),
    settingsSlice: mapSettingsRecordToSlice(input.settings),
    uiSlice: createInitialUiSlice(),
    mobileSlice: {
      hydration_status: "ready",
      hydration_error_message: null,
      profile_record: input.profile,
      settings_record: input.settings,
      active_encounter_context: null,
      attempts_by_encounter: {},
      completed_encounter_ids: [],
      last_transcript_entry: null,
      input_candidate: createEmptyBoardSelectionCandidate(),
    },
  };
};

const clearEncounterAfterResult = async (input: {
  store: StoreApi<MobileAppStoreState>;
  persistence: AppPersistenceGateway;
  next_surface: AppPrimarySurface;
}): Promise<void> => {
  input.store.setState((state) => ({
    ...state,
    sessionSlice: {
      ...state.sessionSlice,
      app_primary_surface: input.next_surface,
      encounter_restore_target: {
        surface: input.next_surface,
        encounter_session_id: null,
        encounter_id: null,
        result_record_id: null,
      },
      active_encounter_session_id: null,
      active_encounter_id: null,
      active_result_record_id: null,
      last_route_change_at_utc: nowUtcIso(),
    },
    encounterSlice: createInitialEncounterSlice(),
    uiSlice: createInitialUiSlice(),
    mobileSlice: {
      ...state.mobileSlice,
      profile_record: state.mobileSlice.profile_record,
      settings_record: state.mobileSlice.settings_record,
      active_encounter_context: null,
      last_transcript_entry: null,
      input_candidate: createEmptyBoardSelectionCandidate(),
    },
  }));

  await input.persistence.saveActiveSnapshot(null);
};

const setPreviewCandidate = (input: {
  set: StoreApi<MobileAppStoreState>["setState"];
  candidate: BoardSelectionCandidate;
  highlighted_word_preview: string;
}): void => {
  input.set((current) => ({
    ...current,
    uiSlice: {
      ...current.uiSlice,
      swipe_preview_path: input.candidate.selected_positions,
      highlighted_word_preview: input.highlighted_word_preview.toUpperCase(),
    },
    mobileSlice: {
      ...current.mobileSlice,
      input_candidate: input.candidate,
    },
  }));
};

const persistSnapshotIfNeeded = async (input: {
  store: StoreApi<MobileAppStoreState>;
  persistence: AppPersistenceGateway;
}): Promise<void> => {
  const runtimeState = input.store.getState().encounterSlice.runtime_state;

  input.store.setState((state) => ({
    ...state,
    encounterSlice: {
      ...state.encounterSlice,
      pending_persist_write: 1,
    },
  }));

  if (!runtimeState) {
    await input.persistence.saveActiveSnapshot(null);
    input.store.setState((state) => ({
      ...state,
      encounterSlice: {
        ...state.encounterSlice,
        pending_persist_write: 0,
        last_persisted_snapshot_updated_at_utc: null,
      },
    }));
    return;
  }

  const snapshot = serializeActiveEncounterSnapshot(runtimeState);
  await input.persistence.saveActiveSnapshot(snapshot);

  input.store.setState((state) => ({
    ...state,
    encounterSlice: {
      ...state.encounterSlice,
      pending_persist_write: 0,
      last_persisted_snapshot_updated_at_utc: snapshot.last_persisted_at_utc,
    },
  }));
};

const resolveCommittedSelection = async (input: {
  store: StoreApi<MobileAppStoreState>;
  persistence: AppPersistenceGateway;
  content: BundledContentRuntime;
  selected_positions: readonly BoardPosition[];
}): Promise<void> => {
  const state = input.store.getState();
  const runtimeState = state.encounterSlice.runtime_state;
  const activeContext = state.mobileSlice.active_encounter_context;
  if (!runtimeState || !activeContext) {
    return;
  }

  const result = applySelectionToEncounterRuntime({
    runtime_state: runtimeState,
    context: activeContext,
    selected_positions: input.selected_positions,
  });
  if (!result.transcript_entry) {
    return;
  }

  const nextTransition = resolveLastTransition(result.transcript_entry);
  const isTerminal = isTerminalState(result.runtime_state);
  const nextSurface = isTerminal ? "result" : "encounter";
  const completedEncounterIds =
    result.runtime_state.session_state === "won"
      ? includeEncounterId(
          state.mobileSlice.completed_encounter_ids,
          result.runtime_state.encounter_id,
        )
      : state.mobileSlice.completed_encounter_ids;
  const nextProfile = updateProfileFromRuntime({
    content: input.content,
    profile: state.mobileSlice.profile_record,
    runtime_state: result.runtime_state,
  });

  input.store.setState((current) => ({
    ...current,
    sessionSlice: {
      ...current.sessionSlice,
      app_primary_surface: nextSurface,
      has_completed_starter_encounter:
        nextProfile?.has_completed_starter_encounter ??
        current.sessionSlice.has_completed_starter_encounter,
      active_encounter_session_id: result.runtime_state.encounter_session_id,
      active_encounter_id: result.runtime_state.encounter_id,
      last_route_change_at_utc: nowUtcIso(),
    },
    encounterSlice: {
      runtime_state: result.runtime_state,
      last_engine_transition: nextTransition,
      pending_persist_write: 1,
      last_persisted_snapshot_updated_at_utc:
        current.encounterSlice.last_persisted_snapshot_updated_at_utc,
    },
    uiSlice: {
      ...current.uiSlice,
      swipe_preview_path: [],
      highlighted_word_preview: "",
      pause_overlay_open: 0,
      result_ack_pending: isTerminal ? 1 : 0,
    },
    mobileSlice: {
      ...current.mobileSlice,
      profile_record: nextProfile,
      completed_encounter_ids: completedEncounterIds,
      last_transcript_entry: result.transcript_entry,
      input_candidate: createEmptyBoardSelectionCandidate(),
    },
  }));

  if (nextProfile) {
    await input.persistence.saveProfile(nextProfile);
  }
  await persistSnapshotIfNeeded({
    store: input.store,
    persistence: input.persistence,
  });
};

const resolveLastTransition = (
  transcriptEntry: HeadlessTranscriptEntry,
): EncounterSessionTransition => {
  if (transcriptEntry.cast_resolution.submission_kind === "valid") {
    return "submit_valid_cast";
  }

  if (transcriptEntry.cast_resolution.submission_kind === "repeated") {
    return "submit_repeated_cast";
  }

  return "submit_invalid_cast";
};

const updateProfileFromRuntime = (input: {
  content: BundledContentRuntime;
  profile: PlayerProfileRecord | null;
  runtime_state: EncounterRuntimeState;
}): PlayerProfileRecord | null => {
  if (!input.profile) {
    return null;
  }

  if (
    input.runtime_state.encounter_id !== getStarterEncounterId(input.content)
  ) {
    return {
      ...input.profile,
      updated_at_utc: nowUtcIso(),
    };
  }

  return {
    ...input.profile,
    has_completed_starter_encounter:
      input.runtime_state.session_state === "won"
        ? 1
        : input.profile.has_completed_starter_encounter,
    starter_result_outcome:
      input.runtime_state.session_state === "won"
        ? "won"
        : input.runtime_state.session_state === "lost"
          ? "lost"
          : input.profile.starter_result_outcome,
    updated_at_utc: nowUtcIso(),
  };
};

const includeEncounterId = (
  encounterIds: readonly string[],
  encounterId: string,
): string[] =>
  encounterIds.includes(encounterId)
    ? encounterIds.slice()
    : [...encounterIds, encounterId];

const mapSettingsRecordToSlice = (
  settings: PlayerSettingsRecord,
): SettingsSliceState => ({
  sfx_enabled: settings.sfx_enabled,
  music_enabled: settings.music_enabled,
  haptics_enabled: settings.haptics_enabled,
  reduce_motion_enabled: settings.reduce_motion_enabled,
  locale_code: settings.locale_code,
  analytics_opt_in: settings.analytics_opt_in,
  has_seen_settings_education: settings.has_seen_settings_education,
});

const createInitialSessionSlice = (): SessionSliceState => ({
  app_session_id: createAppSessionId(),
  app_primary_surface: "starter_flow",
  encounter_restore_target: {
    surface: "starter_flow",
    encounter_session_id: null,
    encounter_id: null,
    result_record_id: null,
  },
  active_encounter_session_id: null,
  active_encounter_id: null,
  active_result_record_id: null,
  starter_tutorial_cue_stage: "cue_01_trace_word",
  starter_tutorial_block_state: "none",
  has_completed_starter_encounter: 0,
  last_route_change_at_utc: nowUtcIso(),
});

const createInitialEncounterSlice = (): EncounterSliceState => ({
  runtime_state: null,
  last_engine_transition: null,
  pending_persist_write: 0,
  last_persisted_snapshot_updated_at_utc: null,
});

const createInitialSettingsSlice = (): SettingsSliceState => ({
  sfx_enabled: 1,
  music_enabled: 1,
  haptics_enabled: 1,
  reduce_motion_enabled: 0,
  locale_code: "en-US",
  analytics_opt_in: 0,
  has_seen_settings_education: 0,
});

const createInitialUiSlice = (): UiSliceState => ({
  swipe_preview_path: [],
  highlighted_word_preview: "",
  transient_banner: "none",
  pause_overlay_open: 0,
  result_ack_pending: 0,
});

const createAppSessionId = (): string =>
  `app-session-${Math.random().toString(36).slice(2, 10)}`;

const isTerminalState = (runtimeState: EncounterRuntimeState): boolean =>
  runtimeState.session_state === "won" ||
  runtimeState.session_state === "lost" ||
  runtimeState.session_state === "recoverable_error";

const nowUtcIso = (): string => new Date().toISOString();

export const getPrimaryEncounterId = (content: BundledContentRuntime): string =>
  getPrimaryChapter(content).encounter_ids[0] ?? "enc_meadow_001";
