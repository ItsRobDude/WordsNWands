import { useEffect, useMemo } from "react";

import { MobileAppShell } from "./src/app/MobileAppShell.tsx";
import { createSQLiteAppPersistence } from "./src/app/persistence/createSQLiteAppPersistence.ts";
import {
  createMobileAppStore,
  getPrimaryEncounterId,
} from "./src/app/store/createMobileAppStore.ts";
import { getBundledPhaseOneContent } from "./src/verticalSlice/bundledContent.ts";
import {
  getEncounterPayload,
  getStarterEncounterId,
} from "./src/verticalSlice/encounterRuntime.ts";

export default function App(): JSX.Element {
  const bundledContent = useMemo(() => getBundledPhaseOneContent(), []);
  const starterEncounterId = useMemo(
    () => getStarterEncounterId(bundledContent),
    [bundledContent],
  );
  const primaryEncounterId = useMemo(
    () => getPrimaryEncounterId(bundledContent),
    [bundledContent],
  );
  const starterEncounter = useMemo(
    () =>
      getEncounterPayload({
        content: bundledContent,
        encounter_id: starterEncounterId,
      }),
    [bundledContent, starterEncounterId],
  );
  const primaryEncounter = useMemo(
    () =>
      getEncounterPayload({
        content: bundledContent,
        encounter_id: primaryEncounterId,
      }),
    [bundledContent, primaryEncounterId],
  );
  const store = useMemo(
    () =>
      createMobileAppStore({
        persistence: createSQLiteAppPersistence(),
        content: bundledContent,
      }),
    [bundledContent],
  );

  useEffect(() => {
    void store.getState().actions.initialize();
  }, [store]);

  return (
    <MobileAppShell
      store={store}
      starter_encounter_id={starterEncounterId}
      primary_encounter_id={primaryEncounterId}
      starter_encounter={starterEncounter}
      primary_encounter={primaryEncounter}
    />
  );
}
