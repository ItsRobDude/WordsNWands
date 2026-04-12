import type { EncounterRuntimeState } from "../../../../../packages/game-rules/src/index.ts";

export interface ResultScreenContent {
  title: string;
  body: string;
  primary_label: string;
  secondary_label: string;
}

export const resolveResultScreenContent = (input: {
  active_state: EncounterRuntimeState | null;
  starter_encounter_id: string;
  has_completed_starter_encounter: boolean;
}): ResultScreenContent => {
  if (!input.active_state) {
    return {
      title: "Encounter Complete",
      body: "The encounter finished and returned to the adventure flow.",
      primary_label: "Return To Home",
      secondary_label: "Return To Home",
    };
  }

  if (input.active_state.session_state === "won") {
    if (input.active_state.encounter_id === input.starter_encounter_id) {
      return {
        title: "Creature Calmed",
        body: "You cleared the starter duel. Chapter 1 is ready whenever you are.",
        primary_label: "Begin Chapter 1",
        secondary_label: "Return To Home",
      };
    }

    return {
      title: "Creature Calmed",
      body: `${input.active_state.creature.display_name} settled down. Your path through Sunspell Meadow is still open.`,
      primary_label: "Return To Home",
      secondary_label: "Return To Home",
    };
  }

  if (input.active_state.session_state === "recoverable_error") {
    return {
      title: "Magic Board Hiccup",
      body: "We couldn't recover a playable board this run. Your progress is safe, and a retry will start fresh.",
      primary_label: "Retry Encounter",
      secondary_label: input.has_completed_starter_encounter
        ? "Return To Home"
        : "Return To Starter Intro",
    };
  }

  return {
    title:
      input.active_state.encounter_id === input.starter_encounter_id &&
      !input.has_completed_starter_encounter
        ? "Retry Starter"
        : "Try Another Spell",
    body: `${input.active_state.creature.display_name} still has ${input.active_state.creature.hp_current} HP left. A retry starts a fresh attempt.`,
    primary_label: "Retry",
    secondary_label: input.has_completed_starter_encounter
      ? "Return To Home"
      : "Return To Starter Intro",
  };
};

export const resolvePauseExitLabel = (
  has_completed_starter_encounter: boolean,
): string =>
  has_completed_starter_encounter
    ? "Return To Home"
    : "Return To Starter Intro";
