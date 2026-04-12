import { SafeAreaView, ScrollView, View } from "react-native";
import { useStore } from "zustand";

import type { StoreApi } from "zustand/vanilla";

import type { RuntimeEncounterPayload } from "../../../../packages/content/src/runtime/createBundledContentRuntime.ts";
import {
  describeCastResolution,
  describeStarterHint,
} from "../verticalSlice/formatters.ts";
import { AppHeader } from "./components/AppHeader.tsx";
import { styles } from "./mobileStyles.ts";
import { EncounterScreen } from "./screens/EncounterScreen.tsx";
import {
  ErrorScreen,
  LoadingScreen,
} from "./screens/BootstrapStatusScreen.tsx";
import { HomeScreen } from "./screens/HomeScreen.tsx";
import { ResultScreen } from "./screens/ResultScreen.tsx";
import { StarterFlowScreen } from "./screens/StarterFlowScreen.tsx";
import type { MobileAppStoreState } from "./store/createMobileAppStore.ts";

export function MobileAppShell(props: {
  store: StoreApi<MobileAppStoreState>;
  starter_encounter_id: string;
  primary_encounter_id: string;
  starter_encounter: RuntimeEncounterPayload;
  primary_encounter: RuntimeEncounterPayload;
}): JSX.Element {
  const surface = useStore(
    props.store,
    (state) => state.sessionSlice.app_primary_surface,
  );
  const hasCompletedStarterEncounter = useStore(
    props.store,
    (state) => state.sessionSlice.has_completed_starter_encounter === 1,
  );
  const activeState = useStore(
    props.store,
    (state) => state.encounterSlice.runtime_state,
  );
  const previewPath = useStore(
    props.store,
    (state) => state.uiSlice.swipe_preview_path,
  );
  const previewWord = useStore(
    props.store,
    (state) => state.uiSlice.highlighted_word_preview,
  );
  const pauseOverlayOpen = useStore(
    props.store,
    (state) => state.uiSlice.pause_overlay_open === 1,
  );
  const lastTranscriptEntry = useStore(
    props.store,
    (state) => state.mobileSlice.last_transcript_entry,
  );
  const completedEncounterIds = useStore(
    props.store,
    (state) => state.mobileSlice.completed_encounter_ids,
  );
  const hydrationStatus = useStore(
    props.store,
    (state) => state.mobileSlice.hydration_status,
  );
  const hydrationError = useStore(
    props.store,
    (state) => state.mobileSlice.hydration_error_message,
  );
  const canResumeEncounter = useStore(
    props.store,
    (state) =>
      state.encounterSlice.runtime_state?.session_state === "in_progress",
  );

  const starterHint = activeState
    ? describeStarterHint({
        runtime_state: activeState,
        transcript_entry: lastTranscriptEntry,
        encounter_id: activeState.encounter_id,
      })
    : null;
  const lastFeedback = describeCastResolution(lastTranscriptEntry);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundOrbA} />
      <View style={styles.backgroundOrbB} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AppHeader />

        {hydrationStatus === "loading" || hydrationStatus === "idle" ? (
          <LoadingScreen />
        ) : null}

        {hydrationStatus === "error" ? (
          <ErrorScreen
            hydration_error={hydrationError}
            on_retry={props.store.getState().actions.initialize}
          />
        ) : null}

        {hydrationStatus === "ready" && surface === "starter_flow" ? (
          <StarterFlowScreen
            has_completed_starter_encounter={hasCompletedStarterEncounter}
            can_resume_encounter={canResumeEncounter}
            starter_intro_flavor_text={
              props.starter_encounter.encounter.introFlavorText
            }
            on_resume={props.store.getState().actions.resumeEncounter}
            on_enter_starter={() =>
              props.store
                .getState()
                .actions.launchEncounter(props.starter_encounter_id)
            }
            on_skip_to_home={() =>
              props.store.getState().actions.setSurface("home")
            }
          />
        ) : null}

        {hydrationStatus === "ready" && surface === "home" ? (
          <HomeScreen
            has_completed_starter_encounter={hasCompletedStarterEncounter}
            primary_encounter_name={
              props.primary_encounter.creature.displayName
            }
            primary_intro_flavor_text={
              props.primary_encounter.encounter.introFlavorText
            }
            completed_encounter_ids={completedEncounterIds}
            can_resume_encounter={canResumeEncounter}
            active_state={activeState}
            on_resume={props.store.getState().actions.resumeEncounter}
            on_continue_chapter={() =>
              props.store
                .getState()
                .actions.launchEncounter(props.primary_encounter_id)
            }
            on_replay_starter={() =>
              props.store
                .getState()
                .actions.launchEncounter(props.starter_encounter_id)
            }
          />
        ) : null}

        {hydrationStatus === "ready" && surface === "encounter" ? (
          <EncounterScreen
            active_state={activeState}
            starter_encounter_id={props.starter_encounter_id}
            has_completed_starter_encounter={hasCompletedStarterEncounter}
            preview_path_length={previewPath.length}
            preview_path={previewPath}
            preview_word={previewWord}
            starter_hint={starterHint}
            last_transcript_entry={lastTranscriptEntry}
            pause_overlay_open={pauseOverlayOpen}
            on_open_pause_menu={props.store.getState().actions.openPauseMenu}
            on_close_pause_menu={props.store.getState().actions.closePauseMenu}
            on_restart_encounter={
              props.store.getState().actions.restartEncounter
            }
            on_leave_encounter={props.store.getState().actions.leaveEncounter}
            on_select_board_position={
              props.store.getState().actions.selectBoardPosition
            }
            on_apply_trace_selection={
              props.store.getState().actions.applyTraceSelection
            }
            on_clear_selection={props.store.getState().actions.clearSelection}
            on_submit_selection={props.store.getState().actions.submitSelection}
          />
        ) : null}

        {hydrationStatus === "ready" && surface === "result" ? (
          <ResultScreen
            active_state={activeState}
            starter_encounter_id={props.starter_encounter_id}
            has_completed_starter_encounter={hasCompletedStarterEncounter}
            on_advance={props.store.getState().actions.advanceFromResult}
            on_return={props.store.getState().actions.returnFromResult}
            last_feedback={lastFeedback}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
