import type {
  BoardSnapshot,
  CreatureRuntimeState,
  EncounterRuntimeState,
} from "../contracts/board.ts";
import type {
  ElementType,
  MatchupResult,
  TileStateKind,
} from "../contracts/core.ts";
import {
  damageModelV1,
  resolveMatchupResult,
} from "../damage/damageModelV1.ts";

export interface DeriveEncounterOutcomeInput {
  encounter_state: EncounterRuntimeState;
  cast: {
    word_length: number;
    cast_element: ElementType;
    used_wand_tile: boolean;
    selected_tile_states?: readonly (TileStateKind | null)[];
  };
  board_after_resolution: BoardSnapshot;
  apply_creature_spell?: (input: {
    encounter_state: EncounterRuntimeState;
    board: BoardSnapshot;
    creature: CreatureRuntimeState;
  }) => {
    board: BoardSnapshot;
    creature: CreatureRuntimeState;
  };
  is_dead_board?: (input: {
    board: BoardSnapshot;
    repeated_words: readonly string[];
  }) => boolean;
  run_spark_shuffle_recovery?: (input: {
    encounter_state: EncounterRuntimeState;
    board: BoardSnapshot;
  }) => BoardSnapshot;
}

export interface DeriveEncounterOutcomeResult {
  encounter_state: EncounterRuntimeState;
  did_win: boolean;
  did_lose: boolean;
  did_trigger_creature_spell: boolean;
  did_trigger_spark_shuffle: boolean;
  matchup_result: MatchupResult;
  final_damage: number;
}

export const deriveEncounterOutcome = (
  input: DeriveEncounterOutcomeInput,
): DeriveEncounterOutcomeResult => {
  const matchup_result = resolveMatchupResult({
    cast_element: input.cast.cast_element,
    weakness_element: input.encounter_state.creature.weakness_element,
    resistance_element: input.encounter_state.creature.resistance_element,
    selected_tile_states: input.cast.selected_tile_states,
  });

  const damage_result = damageModelV1({
    word_length: input.cast.word_length,
    matchup_result,
    cast_element: input.cast.cast_element,
    used_wand_tile: input.cast.used_wand_tile,
    selected_tile_states: input.cast.selected_tile_states,
  });

  const hp_after_damage = Math.max(
    0,
    input.encounter_state.creature.hp_current - damage_result.final_damage,
  );

  const creature_after_damage: CreatureRuntimeState = {
    ...input.encounter_state.creature,
    hp_current: hp_after_damage,
  };

  const did_win = hp_after_damage === 0;

  if (did_win) {
    return {
      encounter_state: {
        ...input.encounter_state,
        creature: creature_after_damage,
        board: input.board_after_resolution,
        session_state: "won",
        terminal_reason_code: "normal_win",
      },
      did_win: true,
      did_lose: false,
      did_trigger_creature_spell: false,
      did_trigger_spark_shuffle: false,
      matchup_result,
      final_damage: damage_result.final_damage,
    };
  }

  const should_stall_countdown = matchup_result === "weakness";
  const countdown_before =
    input.encounter_state.creature.spell_countdown_current;
  const countdown_after = should_stall_countdown
    ? countdown_before
    : Math.max(0, countdown_before - 1);

  const did_trigger_creature_spell = countdown_after === 0;

  const creature_after_countdown: CreatureRuntimeState = {
    ...creature_after_damage,
    spell_countdown_current: did_trigger_creature_spell
      ? creature_after_damage.spell_countdown_reset
      : countdown_after,
  };

  const spell_result = did_trigger_creature_spell
    ? (input.apply_creature_spell ?? defaultApplyCreatureSpell)({
        encounter_state: input.encounter_state,
        board: input.board_after_resolution,
        creature: creature_after_countdown,
      })
    : {
        board: input.board_after_resolution,
        creature: creature_after_countdown,
      };

  const dead_board = (input.is_dead_board ?? defaultIsDeadBoard)({
    board: spell_result.board,
    repeated_words: input.encounter_state.repeated_words,
  });

  const board_after_recovery = dead_board
    ? (input.run_spark_shuffle_recovery ?? defaultRunSparkShuffleRecovery)({
        encounter_state: input.encounter_state,
        board: spell_result.board,
      })
    : spell_result.board;

  const moves_remaining = Math.max(
    0,
    input.encounter_state.moves_remaining - 1,
  );
  const did_lose = moves_remaining === 0;

  return {
    encounter_state: {
      ...input.encounter_state,
      board: board_after_recovery,
      creature: spell_result.creature,
      moves_remaining,
      session_state: did_lose ? "lost" : input.encounter_state.session_state,
      terminal_reason_code: did_lose
        ? "moves_exhausted"
        : input.encounter_state.terminal_reason_code,
    },
    did_win: false,
    did_lose,
    did_trigger_creature_spell,
    did_trigger_spark_shuffle: dead_board,
    matchup_result,
    final_damage: damage_result.final_damage,
  };
};

const defaultApplyCreatureSpell = (input: {
  board: BoardSnapshot;
  creature: CreatureRuntimeState;
}): {
  board: BoardSnapshot;
  creature: CreatureRuntimeState;
} => ({
  board: input.board,
  creature: input.creature,
});

const defaultIsDeadBoard = (): boolean => false;

const defaultRunSparkShuffleRecovery = (input: {
  board: BoardSnapshot;
}): BoardSnapshot => input.board;
