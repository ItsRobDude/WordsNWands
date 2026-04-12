import { useStore } from "zustand";

import { MobileScreenFrame } from "../src/mobileShell/components/MobileScreenFrame.tsx";
import { RouteGate } from "../src/mobileShell/components/RouteGate.tsx";
import { EncounterScreen } from "../src/mobileShell/screens/EncounterScreen.tsx";
import { mobileRuntime } from "../src/mobileShell/runtime.ts";
import { describeStarterHint } from "../src/verticalSlice/formatters.ts";

export default function EncounterRoute(): JSX.Element {
  const hasCompletedStarterEncounter = useStore(
    mobileRuntime.store,
    (state) => state.sessionSlice.has_completed_starter_encounter === 1,
  );
  const activeState = useStore(
    mobileRuntime.store,
    (state) => state.encounterSlice.runtime_state,
  );
  const previewPath = useStore(
    mobileRuntime.store,
    (state) => state.uiSlice.swipe_preview_path,
  );
  const previewWord = useStore(
    mobileRuntime.store,
    (state) => state.uiSlice.highlighted_word_preview,
  );
  const pauseOverlayOpen = useStore(
    mobileRuntime.store,
    (state) => state.uiSlice.pause_overlay_open === 1,
  );
  const lastTranscriptEntry = useStore(
    mobileRuntime.store,
    (state) => state.mobileSlice.last_transcript_entry,
  );

  const starterHint = activeState
    ? describeStarterHint({
        runtime_state: activeState,
        transcript_entry: lastTranscriptEntry,
        encounter_id: activeState.encounter_id,
      })
    : null;

  return (
    <RouteGate route_path="/encounter">
      <MobileScreenFrame show_header={false} scroll_enabled={false}>
        <EncounterScreen
          active_state={activeState}
          starter_encounter_id={mobileRuntime.starterEncounterId}
          has_completed_starter_encounter={hasCompletedStarterEncounter}
          preview_path_length={previewPath.length}
          preview_path={previewPath}
          preview_word={previewWord}
          starter_hint={starterHint}
          last_transcript_entry={lastTranscriptEntry}
          pause_overlay_open={pauseOverlayOpen}
          on_open_pause_menu={
            mobileRuntime.store.getState().actions.openPauseMenu
          }
          on_close_pause_menu={
            mobileRuntime.store.getState().actions.closePauseMenu
          }
          on_restart_encounter={
            mobileRuntime.store.getState().actions.restartEncounter
          }
          on_leave_encounter={
            mobileRuntime.store.getState().actions.leaveEncounter
          }
          on_start_trace_selection={
            mobileRuntime.store.getState().actions.startTraceSelection
          }
          on_extend_trace_selection={
            mobileRuntime.store.getState().actions.extendTraceSelection
          }
          on_cancel_trace_selection={
            mobileRuntime.store.getState().actions.cancelTraceSelection
          }
          on_select_board_position={
            mobileRuntime.store.getState().actions.selectBoardPosition
          }
          on_clear_selection={
            mobileRuntime.store.getState().actions.clearSelection
          }
          on_submit_selection={
            mobileRuntime.store.getState().actions.submitSelection
          }
        />
      </MobileScreenFrame>
    </RouteGate>
  );
}
