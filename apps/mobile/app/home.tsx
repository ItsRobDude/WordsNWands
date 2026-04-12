import { useStore } from "zustand";

import { MobileScreenFrame } from "../src/mobileShell/components/MobileScreenFrame.tsx";
import { HomeScreen } from "../src/mobileShell/screens/HomeScreen.tsx";
import { mobileRuntime } from "../src/mobileShell/runtime.ts";

export default function HomeRoute(): JSX.Element {
  const hasCompletedStarterEncounter = useStore(
    mobileRuntime.store,
    (state) => state.sessionSlice.has_completed_starter_encounter === 1,
  );
  const activeState = useStore(
    mobileRuntime.store,
    (state) => state.encounterSlice.runtime_state,
  );
  const completedEncounterIds = useStore(
    mobileRuntime.store,
    (state) => state.mobileSlice.completed_encounter_ids,
  );
  const canResumeEncounter = useStore(
    mobileRuntime.store,
    (state) =>
      state.encounterSlice.runtime_state?.session_state === "in_progress",
  );

  return (
    <MobileScreenFrame>
      <HomeScreen
        has_completed_starter_encounter={hasCompletedStarterEncounter}
        primary_encounter_name={
          mobileRuntime.primaryEncounter.creature.displayName
        }
        primary_intro_flavor_text={
          mobileRuntime.primaryEncounter.encounter.introFlavorText
        }
        completed_encounter_ids={completedEncounterIds}
        can_resume_encounter={canResumeEncounter}
        active_state={activeState}
        on_resume={mobileRuntime.store.getState().actions.resumeEncounter}
        on_continue_chapter={() =>
          mobileRuntime.store
            .getState()
            .actions.launchEncounter(mobileRuntime.primaryEncounterId)
        }
        on_replay_starter={() =>
          mobileRuntime.store
            .getState()
            .actions.launchEncounter(mobileRuntime.starterEncounterId)
        }
      />
    </MobileScreenFrame>
  );
}
