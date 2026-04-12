import { getBundledPhaseOneContent } from "../verticalSlice/bundledContent.ts";
import {
  getEncounterPayload,
  getStarterEncounterId,
} from "../verticalSlice/encounterRuntime.ts";
import { createSQLiteAppPersistence } from "./persistence/createSQLiteAppPersistence.ts";
import {
  createMobileAppStore,
  getPrimaryEncounterId,
  type MobileAppStoreState,
} from "./store/createMobileAppStore.ts";

const bundledContent = getBundledPhaseOneContent();
const starterEncounterId = getStarterEncounterId(bundledContent);
const primaryEncounterId = getPrimaryEncounterId(bundledContent);
const starterEncounter = getEncounterPayload({
  content: bundledContent,
  encounter_id: starterEncounterId,
});
const primaryEncounter = getEncounterPayload({
  content: bundledContent,
  encounter_id: primaryEncounterId,
});
const store = createMobileAppStore({
  persistence: createSQLiteAppPersistence(),
  content: bundledContent,
});

let initializationPromise: Promise<void> | null = null;

export const mobileRuntime = {
  bundledContent,
  starterEncounterId,
  primaryEncounterId,
  starterEncounter,
  primaryEncounter,
  store,
};

export const ensureMobileRuntimeInitialized = (): Promise<void> => {
  if (!initializationPromise) {
    initializationPromise = store.getState().actions.initialize();
  }

  return initializationPromise;
};

export const resolveRoutePath = (input: {
  hydration_status: MobileAppStoreState["mobileSlice"]["hydration_status"];
  surface: MobileAppStoreState["sessionSlice"]["app_primary_surface"];
}): "/loading" | "/error" | "/starter" | "/home" | "/encounter" | "/result" => {
  if (input.hydration_status === "error") {
    return "/error";
  }

  if (
    input.hydration_status === "idle" ||
    input.hydration_status === "loading"
  ) {
    return "/loading";
  }

  if (input.surface === "home") {
    return "/home";
  }

  if (input.surface === "encounter") {
    return "/encounter";
  }

  if (input.surface === "result") {
    return "/result";
  }

  return "/starter";
};
