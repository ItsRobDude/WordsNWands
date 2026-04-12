import { useStore } from "zustand";

import { MobileScreenFrame } from "../src/mobileShell/components/MobileScreenFrame.tsx";
import { RouteGate } from "../src/mobileShell/components/RouteGate.tsx";
import { ResultScreen } from "../src/mobileShell/screens/ResultScreen.tsx";
import { mobileRuntime } from "../src/mobileShell/runtime.ts";
import { describeCastResolution } from "../src/verticalSlice/formatters.ts";

export default function ResultRoute(): JSX.Element {
  const hasCompletedStarterEncounter = useStore(
    mobileRuntime.store,
    (state) => state.sessionSlice.has_completed_starter_encounter === 1,
  );
  const activeState = useStore(
    mobileRuntime.store,
    (state) => state.encounterSlice.runtime_state,
  );
  const lastTranscriptEntry = useStore(
    mobileRuntime.store,
    (state) => state.mobileSlice.last_transcript_entry,
  );

  return (
    <RouteGate route_path="/result">
      <MobileScreenFrame>
        <ResultScreen
          active_state={activeState}
          starter_encounter_id={mobileRuntime.starterEncounterId}
          has_completed_starter_encounter={hasCompletedStarterEncounter}
          on_advance={mobileRuntime.store.getState().actions.advanceFromResult}
          on_return={mobileRuntime.store.getState().actions.returnFromResult}
          last_feedback={describeCastResolution(lastTranscriptEntry)}
        />
      </MobileScreenFrame>
    </RouteGate>
  );
}
