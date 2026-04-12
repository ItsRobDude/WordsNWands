import { useStore } from "zustand";

import { MobileScreenFrame } from "../src/mobileShell/components/MobileScreenFrame.tsx";
import { RouteGate } from "../src/mobileShell/components/RouteGate.tsx";
import { StarterFlowScreen } from "../src/mobileShell/screens/StarterFlowScreen.tsx";
import { mobileRuntime } from "../src/mobileShell/runtime.ts";

export default function StarterRoute(): JSX.Element {
  const hasCompletedStarterEncounter = useStore(
    mobileRuntime.store,
    (state) => state.sessionSlice.has_completed_starter_encounter === 1,
  );
  const canResumeEncounter = useStore(
    mobileRuntime.store,
    (state) =>
      state.encounterSlice.runtime_state?.session_state === "in_progress",
  );

  return (
    <RouteGate route_path="/starter">
      <MobileScreenFrame>
        <StarterFlowScreen
          has_completed_starter_encounter={hasCompletedStarterEncounter}
          can_resume_encounter={canResumeEncounter}
          starter_intro_flavor_text={
            mobileRuntime.starterEncounter.encounter.introFlavorText
          }
          on_resume={mobileRuntime.store.getState().actions.resumeEncounter}
          on_enter_starter={() =>
            mobileRuntime.store
              .getState()
              .actions.launchEncounter(mobileRuntime.starterEncounterId)
          }
          on_skip_to_home={() =>
            mobileRuntime.store.getState().actions.setSurface("home")
          }
        />
      </MobileScreenFrame>
    </RouteGate>
  );
}
