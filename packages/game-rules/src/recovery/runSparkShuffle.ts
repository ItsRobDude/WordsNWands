import type {
  BoardSnapshot,
  EncounterRuntimeState,
} from "../contracts/board.js";
import type { EncounterTerminalReasonCode } from "../contracts/core.js";

export type SparkShuffleFallbackOutcome =
  | "none"
  | "deterministic_emergency_regen"
  | "recoverable_error_end";

export interface SparkShuffleMetadata {
  trigger_reason: "dead_board";
  retries_attempted: number;
  max_shuffle_retries_per_recovery_cycle: number;
  did_hit_retry_cap: boolean;
  fallback_outcome: SparkShuffleFallbackOutcome;
  did_recover_playable_state: boolean;
  spark_shuffle_retry_count_before: number;
  spark_shuffle_retry_count_after: number;
}

export interface RunSparkShuffleInput {
  encounter_state: EncounterRuntimeState;
  has_playable_word: (board: BoardSnapshot) => boolean;
  next_random_index: (max_exclusive: number) => number;
  run_deterministic_emergency_regeneration?: (input: {
    encounter_state: EncounterRuntimeState;
  }) => {
    board: BoardSnapshot;
    did_recover_playable_state: boolean;
  };
  max_shuffle_retries_per_recovery_cycle?: number;
}

export interface RunSparkShuffleResult {
  encounter_state: EncounterRuntimeState;
  metadata: SparkShuffleMetadata;
}

const DEFAULT_MAX_SHUFFLE_RETRIES_PER_RECOVERY_CYCLE = 3;

export const runSparkShuffle = ({
  encounter_state,
  has_playable_word,
  next_random_index,
  run_deterministic_emergency_regeneration,
  max_shuffle_retries_per_recovery_cycle = DEFAULT_MAX_SHUFFLE_RETRIES_PER_RECOVERY_CYCLE,
}: RunSparkShuffleInput): RunSparkShuffleResult => {
  let board = encounter_state.board;
  let retries_attempted = 0;
  let did_recover_playable_state = false;

  while (retries_attempted < max_shuffle_retries_per_recovery_cycle) {
    retries_attempted += 1;
    board = shuffleBoardByTilePermutation(board, next_random_index);

    if (has_playable_word(board)) {
      did_recover_playable_state = true;
      break;
    }
  }

  const retry_count_before = encounter_state.spark_shuffle_retry_count;
  const retry_count_after = retry_count_before + retries_attempted;
  const did_hit_retry_cap =
    !did_recover_playable_state &&
    retries_attempted >= max_shuffle_retries_per_recovery_cycle;

  if (did_recover_playable_state) {
    return {
      encounter_state: {
        ...encounter_state,
        board,
        spark_shuffle_retry_count: retry_count_after,
      },
      metadata: {
        trigger_reason: "dead_board",
        retries_attempted,
        max_shuffle_retries_per_recovery_cycle,
        did_hit_retry_cap,
        fallback_outcome: "none",
        did_recover_playable_state: true,
        spark_shuffle_retry_count_before: retry_count_before,
        spark_shuffle_retry_count_after: retry_count_after,
      },
    };
  }

  if (did_hit_retry_cap && run_deterministic_emergency_regeneration) {
    const regeneration_result = run_deterministic_emergency_regeneration({
      encounter_state: {
        ...encounter_state,
        board,
        spark_shuffle_retry_count: retry_count_after,
      },
    });

    if (regeneration_result.did_recover_playable_state) {
      return {
        encounter_state: {
          ...encounter_state,
          board: regeneration_result.board,
          spark_shuffle_retry_count: retry_count_after,
        },
        metadata: {
          trigger_reason: "dead_board",
          retries_attempted,
          max_shuffle_retries_per_recovery_cycle,
          did_hit_retry_cap: true,
          fallback_outcome: "deterministic_emergency_regen",
          did_recover_playable_state: true,
          spark_shuffle_retry_count_before: retry_count_before,
          spark_shuffle_retry_count_after: retry_count_after,
        },
      };
    }

    return {
      encounter_state: setRecoverableErrorState({
        encounter_state,
        board: regeneration_result.board,
        retry_count_after,
      }),
      metadata: {
        trigger_reason: "dead_board",
        retries_attempted,
        max_shuffle_retries_per_recovery_cycle,
        did_hit_retry_cap: true,
        fallback_outcome: "recoverable_error_end",
        did_recover_playable_state: false,
        spark_shuffle_retry_count_before: retry_count_before,
        spark_shuffle_retry_count_after: retry_count_after,
      },
    };
  }

  return {
    encounter_state: {
      ...encounter_state,
      board,
      spark_shuffle_retry_count: retry_count_after,
    },
    metadata: {
      trigger_reason: "dead_board",
      retries_attempted,
      max_shuffle_retries_per_recovery_cycle,
      did_hit_retry_cap,
      fallback_outcome: did_hit_retry_cap ? "recoverable_error_end" : "none",
      did_recover_playable_state: false,
      spark_shuffle_retry_count_before: retry_count_before,
      spark_shuffle_retry_count_after: retry_count_after,
    },
  };
};

const shuffleBoardByTilePermutation = (
  board: BoardSnapshot,
  next_random_index: (max_exclusive: number) => number,
): BoardSnapshot => {
  if (board.tiles.length <= 1) {
    return board;
  }

  const source_tiles = [...board.tiles];
  const shuffled_tiles = [...source_tiles];

  for (
    let current_index = shuffled_tiles.length - 1;
    current_index > 0;
    current_index -= 1
  ) {
    const random_index = clampRandomIndex(
      next_random_index(current_index + 1),
      current_index + 1,
    );

    const temp_tile = shuffled_tiles[current_index];
    shuffled_tiles[current_index] = shuffled_tiles[random_index];
    shuffled_tiles[random_index] = temp_tile;
  }

  const occupied_positions = source_tiles
    .map((tile) => tile.position)
    .sort((left, right) =>
      left.row === right.row ? left.col - right.col : left.row - right.row,
    );

  const reassigned_tiles = shuffled_tiles.map((tile, index) => ({
    ...tile,
    position: occupied_positions[index],
  }));

  return {
    ...board,
    tiles: reassigned_tiles,
  };
};

const clampRandomIndex = (index: number, max_exclusive: number): number => {
  if (Number.isNaN(index) || !Number.isFinite(index)) {
    return 0;
  }

  if (index < 0) {
    return 0;
  }

  if (index >= max_exclusive) {
    return max_exclusive - 1;
  }

  return Math.floor(index);
};

const setRecoverableErrorState = (input: {
  encounter_state: EncounterRuntimeState;
  board: BoardSnapshot;
  retry_count_after: number;
}): EncounterRuntimeState => {
  const terminal_reason_code: EncounterTerminalReasonCode =
    "spark_shuffle_retry_cap_unrecoverable";

  return {
    ...input.encounter_state,
    board: input.board,
    session_state: "recoverable_error",
    terminal_reason_code,
    spark_shuffle_retry_count: input.retry_count_after,
  };
};
