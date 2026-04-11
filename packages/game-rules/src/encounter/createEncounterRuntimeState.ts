import type {
  BoardSnapshot,
  CreatureRuntimeState,
  EncounterRngStreamStates,
  EncounterRuntimeState,
} from "../contracts/board.js";
import type { EncounterSessionState } from "../contracts/core.js";

const DEFAULT_SESSION_STATE: Extract<
  EncounterSessionState,
  "unopened" | "intro_presented" | "in_progress"
> = "unopened";

export interface CreateEncounterRuntimeStateInput {
  encounter_session_id: string;
  encounter_id: string;
  encounter_seed: string;
  board: Omit<BoardSnapshot, "rng_stream_states">;
  creature: CreatureRuntimeState;
  move_budget_total: number;
  updated_at_utc: string;
  session_state?: Extract<
    EncounterSessionState,
    "unopened" | "intro_presented" | "in_progress"
  >;
  moves_remaining?: number;
  repeated_words?: readonly string[];
  casts_resolved_count?: number;
  spark_shuffle_retry_count?: number;
  rng_stream_states?: Partial<EncounterRngStreamStates>;
}

export const createEncounterRuntimeState = (
  input: CreateEncounterRuntimeStateInput,
): EncounterRuntimeState => {
  const session_state = input.session_state ?? DEFAULT_SESSION_STATE;
  const move_budget_total = Math.max(1, Math.floor(input.move_budget_total));
  const moves_remaining = clampMovesRemaining(
    input.moves_remaining ?? move_budget_total,
    move_budget_total,
  );

  const rng_stream_states = createSeededRngStreamStates({
    encounter_seed: input.encounter_seed,
    encounter_id: input.encounter_id,
    initial_states: input.rng_stream_states,
  });

  return {
    encounter_session_id: input.encounter_session_id,
    encounter_id: input.encounter_id,
    encounter_seed: input.encounter_seed,
    board: {
      ...input.board,
      tiles: input.board.tiles.map((tile) => ({
        ...tile,
        position: { ...tile.position },
        state_turns_remaining: tile.state_turns_remaining ?? null,
      })),
      rng_stream_states,
    },
    creature: {
      ...input.creature,
    },
    session_state,
    terminal_reason_code: null,
    moves_remaining,
    move_budget_total,
    repeated_words: [...(input.repeated_words ?? [])],
    casts_resolved_count: Math.max(0, input.casts_resolved_count ?? 0),
    spark_shuffle_retry_count: Math.max(
      0,
      input.spark_shuffle_retry_count ?? 0,
    ),
    updated_at_utc: input.updated_at_utc,
  };
};

const createSeededRngStreamStates = (input: {
  encounter_seed: string;
  encounter_id: string;
  initial_states?: Partial<EncounterRngStreamStates>;
}): EncounterRngStreamStates => ({
  board_fill_stream_state:
    input.initial_states?.board_fill_stream_state ??
    deriveSeededStreamState({
      encounter_seed: input.encounter_seed,
      encounter_id: input.encounter_id,
      stream_label: "board_fill",
    }),
  creature_spell_stream_state:
    input.initial_states?.creature_spell_stream_state ??
    deriveSeededStreamState({
      encounter_seed: input.encounter_seed,
      encounter_id: input.encounter_id,
      stream_label: "creature_spell",
    }),
  spark_shuffle_stream_state:
    input.initial_states?.spark_shuffle_stream_state ??
    deriveSeededStreamState({
      encounter_seed: input.encounter_seed,
      encounter_id: input.encounter_id,
      stream_label: "spark_shuffle",
    }),
});

const deriveSeededStreamState = (input: {
  encounter_seed: string;
  encounter_id: string;
  stream_label: "board_fill" | "creature_spell" | "spark_shuffle";
}): string =>
  `${input.encounter_seed}::${input.encounter_id}::${input.stream_label}::v1::0`;

const clampMovesRemaining = (
  moves_remaining: number,
  move_budget_total: number,
): number => {
  if (Number.isNaN(moves_remaining) || !Number.isFinite(moves_remaining)) {
    return move_budget_total;
  }

  return Math.min(move_budget_total, Math.max(0, Math.floor(moves_remaining)));
};
