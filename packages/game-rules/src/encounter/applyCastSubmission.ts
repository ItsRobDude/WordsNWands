import type {
  BoardSnapshot,
  EncounterRngStreamStates,
  EncounterRuntimeState,
} from "../contracts/board.js";
import type { CastResolution, CastSubmission } from "../contracts/cast.js";

export interface CastSubmissionValidationResult {
  cast_resolution: CastResolution;
  normalized_word: string | null;
}

export interface ElementAndWandResolution {
  element: Extract<CastResolution, { submission_kind: "valid" }>["element"];
  used_wand_tile: boolean;
}

export interface DamageComputationResult {
  cast_resolution: Extract<CastResolution, { submission_kind: "valid" }>;
  creature: EncounterRuntimeState["creature"];
}

export interface HpApplicationResult {
  cast_resolution: Extract<CastResolution, { submission_kind: "valid" }>;
  creature: EncounterRuntimeState["creature"];
  did_win: boolean;
}

export interface CountdownEvaluationResult {
  creature: EncounterRuntimeState["creature"];
  did_trigger_creature_spell: boolean;
}

export interface DeadBoardDetectionResult {
  is_dead_board: boolean;
}

export interface SparkShuffleRecoveryResult {
  encounter_state: EncounterRuntimeState;
}

export interface ApplyCastSubmissionDependencies {
  validate_submission: (input: {
    encounter_state: EncounterRuntimeState;
    submission: CastSubmission;
  }) => CastSubmissionValidationResult;
  resolve_element_and_wand: (input: {
    encounter_state: EncounterRuntimeState;
    submission: CastSubmission;
    normalized_word: string;
  }) => ElementAndWandResolution;
  consume_tiles: (input: {
    board: BoardSnapshot;
    submission: CastSubmission;
  }) => BoardSnapshot;
  collapse_columns: (input: { board: BoardSnapshot }) => BoardSnapshot;
  refill_board: (input: {
    board: BoardSnapshot;
    rng_stream_states: EncounterRngStreamStates;
  }) => {
    board: BoardSnapshot;
    rng_stream_states: EncounterRngStreamStates;
  };
  apply_bubble_rise: (input: { board: BoardSnapshot }) => BoardSnapshot;
  compute_damage: (input: {
    encounter_state: EncounterRuntimeState;
    cast_resolution: Extract<CastResolution, { submission_kind: "valid" }>;
    element: ElementAndWandResolution["element"];
    used_wand_tile: boolean;
  }) => DamageComputationResult;
  apply_hp: (input: {
    encounter_state: EncounterRuntimeState;
    damage_result: DamageComputationResult;
  }) => HpApplicationResult;
  evaluate_countdown: (input: {
    encounter_state: EncounterRuntimeState;
    cast_resolution: Extract<CastResolution, { submission_kind: "valid" }>;
    creature: EncounterRuntimeState["creature"];
  }) => CountdownEvaluationResult;
  apply_creature_spell: (input: {
    encounter_state: EncounterRuntimeState;
    board: BoardSnapshot;
    creature: EncounterRuntimeState["creature"];
    rng_stream_states: EncounterRngStreamStates;
  }) => {
    board: BoardSnapshot;
    creature: EncounterRuntimeState["creature"];
    rng_stream_states: EncounterRngStreamStates;
  };
  tick_surviving_tile_states: (input: {
    board: BoardSnapshot;
  }) => BoardSnapshot;
  detect_dead_board: (input: {
    board: BoardSnapshot;
    repeated_words: readonly string[];
  }) => DeadBoardDetectionResult;
  run_spark_shuffle_recovery: (input: {
    encounter_state: EncounterRuntimeState;
    board: BoardSnapshot;
    creature: EncounterRuntimeState["creature"];
    rng_stream_states: EncounterRngStreamStates;
  }) => SparkShuffleRecoveryResult;
}

export interface ApplyCastSubmissionInput {
  encounter_state: EncounterRuntimeState;
  submission: CastSubmission;
  dependencies: ApplyCastSubmissionDependencies;
}

export interface ApplyCastSubmissionResult {
  encounter_state: EncounterRuntimeState;
  cast_resolution: CastResolution;
}

export const applyCastSubmission = ({
  encounter_state,
  submission,
  dependencies,
}: ApplyCastSubmissionInput): ApplyCastSubmissionResult => {
  const validation_result = dependencies.validate_submission({
    encounter_state,
    submission,
  });

  if (validation_result.cast_resolution.submission_kind !== "valid") {
    return {
      encounter_state,
      cast_resolution: validation_result.cast_resolution,
    };
  }

  const element_and_wand = dependencies.resolve_element_and_wand({
    encounter_state,
    submission,
    normalized_word:
      validation_result.normalized_word ??
      validation_result.cast_resolution.normalized_word,
  });

  const consumed_board = dependencies.consume_tiles({
    board: encounter_state.board,
    submission,
  });

  const collapsed_board = dependencies.collapse_columns({
    board: consumed_board,
  });

  const refill_result = dependencies.refill_board({
    board: collapsed_board,
    rng_stream_states: encounter_state.board.rng_stream_states,
  });

  const bubble_resolved_board = dependencies.apply_bubble_rise({
    board: refill_result.board,
  });

  const damage_result = dependencies.compute_damage({
    encounter_state,
    cast_resolution: validation_result.cast_resolution,
    element: element_and_wand.element,
    used_wand_tile: element_and_wand.used_wand_tile,
  });

  const hp_result = dependencies.apply_hp({ encounter_state, damage_result });

  if (hp_result.did_win) {
    return {
      encounter_state: {
        ...encounter_state,
        board: {
          ...bubble_resolved_board,
          rng_stream_states: refill_result.rng_stream_states,
        },
        creature: hp_result.creature,
      },
      cast_resolution: {
        ...hp_result.cast_resolution,
        countdown_after_cast: encounter_state.creature.spell_countdown_current,
        countdown_decremented: 0,
      },
    };
  }

  const countdown_result = dependencies.evaluate_countdown({
    encounter_state,
    cast_resolution: hp_result.cast_resolution,
    creature: hp_result.creature,
  });

  const spell_result = countdown_result.did_trigger_creature_spell
    ? dependencies.apply_creature_spell({
        encounter_state,
        board: bubble_resolved_board,
        creature: countdown_result.creature,
        rng_stream_states: refill_result.rng_stream_states,
      })
    : {
        board: bubble_resolved_board,
        creature: countdown_result.creature,
        rng_stream_states: refill_result.rng_stream_states,
      };

  const ticked_board = dependencies.tick_surviving_tile_states({
    board: spell_result.board,
  });

  const repeated_words_after_cast = [
    ...encounter_state.repeated_words,
    hp_result.cast_resolution.normalized_word,
  ];

  const dead_board_result = dependencies.detect_dead_board({
    board: ticked_board,
    repeated_words: repeated_words_after_cast,
  });

  const recovered = dead_board_result.is_dead_board
    ? dependencies.run_spark_shuffle_recovery({
        encounter_state: {
          ...encounter_state,
          repeated_words: repeated_words_after_cast,
        },
        board: ticked_board,
        creature: spell_result.creature,
        rng_stream_states: spell_result.rng_stream_states,
      })
    : null;

  return {
    encounter_state: recovered?.encounter_state ?? {
      ...encounter_state,
      board: {
        ...ticked_board,
        rng_stream_states: spell_result.rng_stream_states,
      },
      creature: spell_result.creature,
    },
    cast_resolution: hp_result.cast_resolution,
  };
};
