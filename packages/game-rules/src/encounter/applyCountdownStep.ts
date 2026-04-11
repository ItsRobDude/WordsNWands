import type { EncounterRuntimeState } from "../contracts/board.js";
import type {
  EncounterSessionState,
  MatchupResult,
} from "../contracts/core.js";

export interface ApplyCountdownStepInput {
  encounter_state: EncounterRuntimeState;
  matchup_result: MatchupResult;
}

export interface ApplyCountdownStepResult {
  encounter_state: EncounterRuntimeState;
  countdown_before: number;
  countdown_after: number;
  countdown_decremented: 0 | 1;
  did_trigger_creature_spell: boolean;
}

const TERMINAL_SESSION_STATES: readonly EncounterSessionState[] = [
  "won",
  "lost",
  "recoverable_error",
  "abandoned",
];

export const applyCountdownStep = ({
  encounter_state,
  matchup_result,
}: ApplyCountdownStepInput): ApplyCountdownStepResult => {
  const countdown_before = encounter_state.creature.spell_countdown_current;

  if (
    encounter_state.session_state !== "in_progress" ||
    TERMINAL_SESSION_STATES.includes(encounter_state.session_state)
  ) {
    return {
      encounter_state,
      countdown_before,
      countdown_after: countdown_before,
      countdown_decremented: 0,
      did_trigger_creature_spell: false,
    };
  }

  if (matchup_result === "weakness") {
    return {
      encounter_state,
      countdown_before,
      countdown_after: countdown_before,
      countdown_decremented: 0,
      did_trigger_creature_spell: false,
    };
  }

  const decremented_countdown = Math.max(0, countdown_before - 1);
  const did_trigger_creature_spell = decremented_countdown === 0;
  const countdown_after = did_trigger_creature_spell
    ? Math.max(1, encounter_state.creature.spell_countdown_reset)
    : decremented_countdown;

  return {
    encounter_state: {
      ...encounter_state,
      creature: {
        ...encounter_state.creature,
        spell_countdown_current: countdown_after,
      },
    },
    countdown_before,
    countdown_after,
    countdown_decremented: did_trigger_creature_spell
      ? 1
      : countdown_before === countdown_after
        ? 0
        : 1,
    did_trigger_creature_spell,
  };
};
