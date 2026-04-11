import {
  resolveElementForWord,
  type ValidationSnapshotLookup,
} from "../../../validation/src/index.ts";

import type { EncounterRuntimeState } from "../contracts/board.ts";
import type { CastResolution, CastSubmission } from "../contracts/cast.ts";
import type {
  EncounterSessionState,
  EncounterTerminalReasonCode,
} from "../contracts/core.ts";
import { collapseColumns } from "../board/collapseColumns.ts";
import { consumeTiles } from "../board/consumeTiles.ts";
import { hasPlayableWord } from "../board/hasPlayableWord.ts";
import { refillBoard } from "../board/refillBoard.ts";
import { applyCastSubmission } from "../encounter/applyCastSubmission.ts";
import { applyCountdownStep } from "../encounter/applyCountdownStep.ts";
import { createEncounterRuntimeState } from "../encounter/createEncounterRuntimeState.ts";
import { validateCastSubmission } from "../encounter/validateCastSubmission.ts";

export interface HeadlessEncounterDefinition {
  encounter_session_id: string;
  encounter_id: string;
  encounter_seed: string;
  board: Parameters<typeof createEncounterRuntimeState>[0]["board"];
  creature: Parameters<typeof createEncounterRuntimeState>[0]["creature"];
  move_budget_total: number;
  session_state?: Extract<
    EncounterSessionState,
    "unopened" | "intro_presented" | "in_progress"
  >;
  validation: {
    validation_lookup: ValidationSnapshotLookup;
    minimum_word_length?: number;
  };
}

export interface HeadlessRunInput {
  encounter: HeadlessEncounterDefinition;
  cast_submissions: readonly CastSubmission[];
}

export interface EncounterStateDelta {
  session_state_before: EncounterSessionState;
  session_state_after: EncounterSessionState;
  moves_remaining_before: number;
  moves_remaining_after: number;
  creature_hp_before: number;
  creature_hp_after: number;
  countdown_before: number;
  countdown_after: number;
  repeated_words_count_before: number;
  repeated_words_count_after: number;
  terminal_reason_before: EncounterTerminalReasonCode | null;
  terminal_reason_after: EncounterTerminalReasonCode | null;
}

export interface HeadlessTranscriptEntry {
  cast_index: number;
  submission: CastSubmission;
  cast_resolution: CastResolution;
  delta: EncounterStateDelta;
}

export interface HeadlessTerminalResult {
  outcome: "won" | "lost" | "recoverable_error";
  terminal_reason: EncounterTerminalReasonCode;
}

export interface HeadlessRunResult {
  terminal: HeadlessTerminalResult;
  terminal_snapshot: EncounterRuntimeState;
  transcript: HeadlessTranscriptEntry[];
  deterministic_serialized: {
    terminal_snapshot: string;
    transcript: string;
  };
}

const TERMINAL_STATE_TO_OUTCOME: Record<
  Extract<EncounterSessionState, "won" | "lost" | "recoverable_error">,
  HeadlessTerminalResult["outcome"]
> = {
  won: "won",
  lost: "lost",
  recoverable_error: "recoverable_error",
};

export const runEncounterHeadless = ({
  encounter,
  cast_submissions,
}: HeadlessRunInput): HeadlessRunResult => {
  let encounter_state = createEncounterRuntimeState({
    encounter_session_id: encounter.encounter_session_id,
    encounter_id: encounter.encounter_id,
    encounter_seed: encounter.encounter_seed,
    board: encounter.board,
    creature: encounter.creature,
    move_budget_total: encounter.move_budget_total,
    session_state: encounter.session_state ?? "in_progress",
    updated_at_utc: "2026-01-01T00:00:00.000Z",
  });

  const transcript: HeadlessTranscriptEntry[] = [];

  for (const [cast_index, submission] of cast_submissions.entries()) {
    if (isTerminal(encounter_state.session_state)) {
      break;
    }

    let did_hit_unrecoverable_dead_board = false;
    const before_state = encounter_state;

    const result = applyCastSubmission({
      encounter_state,
      submission,
      dependencies: {
        validate_submission: ({ encounter_state: current_state, submission }) =>
          validateCastSubmission({
            encounter_state: current_state,
            submission,
            validation_lookup: encounter.validation.validation_lookup,
            minimum_word_length: encounter.validation.minimum_word_length,
          }),
        resolve_element_and_wand: ({ submission, normalized_word }) => ({
          element:
            resolveElementForWord(
              normalized_word,
              encounter.validation.validation_lookup,
            ) ?? "arcane",
          used_wand_tile: submission.selected_positions.some((position) => {
            const tile = before_state.board.tiles.find(
              (candidate) =>
                candidate.position.row === position.row &&
                candidate.position.col === position.col,
            );
            return tile?.special_marker === "wand";
          }),
        }),
        consume_tiles: ({ board, submission }) =>
          consumeTiles({
            board,
            submission,
          }),
        collapse_columns: ({ board }) =>
          collapseColumns({
            board,
          }),
        refill_board: ({ board, rng_stream_states }) =>
          refillBoard({
            board,
            rng_stream_states,
          }),
        compute_damage: ({ cast_resolution, encounter_state }) => ({
          cast_resolution,
          creature: {
            ...encounter_state.creature,
          },
        }),
        apply_hp: ({ encounter_state, damage_result }) => {
          const damage_applied = damage_result.cast_resolution.damage_applied;
          const hp_current = Math.max(
            0,
            encounter_state.creature.hp_current - damage_applied,
          );
          const did_win = hp_current === 0;

          return {
            cast_resolution: damage_result.cast_resolution,
            creature: {
              ...damage_result.creature,
              hp_current,
            },
            did_win,
          };
        },
        evaluate_countdown: ({
          encounter_state,
          cast_resolution,
          creature,
        }) => {
          const countdown = applyCountdownStep({
            encounter_state: {
              ...encounter_state,
              creature,
            },
            matchup_result: cast_resolution.matchup_result,
          });

          return {
            creature: countdown.encounter_state.creature,
            did_trigger_creature_spell: countdown.did_trigger_creature_spell,
          };
        },
        apply_creature_spell: ({ board, creature, rng_stream_states }) => ({
          board,
          creature,
          rng_stream_states,
        }),
        tick_surviving_tile_states: ({ board }) => board,
        detect_dead_board: ({ board, repeated_words }) => ({
          is_dead_board: !hasPlayableWord({
            board,
            repeated_words,
            validation_lookup: encounter.validation.validation_lookup,
          }),
        }),
        run_spark_shuffle_recovery: ({ board, rng_stream_states }) => {
          did_hit_unrecoverable_dead_board = true;
          return {
            board,
            rng_stream_states,
          };
        },
      },
    });

    encounter_state = applyPostCastProgression({
      previous: before_state,
      next: result.encounter_state,
      cast_resolution: result.cast_resolution,
      did_hit_unrecoverable_dead_board,
      cast_index,
    });

    transcript.push({
      cast_index,
      submission: structuredClone(submission),
      cast_resolution: structuredClone(result.cast_resolution),
      delta: deriveDelta(before_state, encounter_state),
    });
  }

  const terminal = resolveTerminal(encounter_state);

  return {
    terminal,
    terminal_snapshot: encounter_state,
    transcript,
    deterministic_serialized: {
      terminal_snapshot: stableStringify(encounter_state),
      transcript: stableStringify(transcript),
    },
  };
};

const applyPostCastProgression = (input: {
  previous: EncounterRuntimeState;
  next: EncounterRuntimeState;
  cast_resolution: CastResolution;
  did_hit_unrecoverable_dead_board: boolean;
  cast_index: number;
}): EncounterRuntimeState => {
  const next_state: EncounterRuntimeState = {
    ...input.next,
    updated_at_utc: `2026-01-01T00:00:${String(input.cast_index).padStart(2, "0")}.000Z`,
  };

  if (input.cast_resolution.submission_kind !== "valid") {
    return next_state;
  }

  const updated_after_valid: EncounterRuntimeState = {
    ...next_state,
    moves_remaining: Math.max(0, input.previous.moves_remaining - 1),
    repeated_words: [
      ...input.previous.repeated_words,
      input.cast_resolution.normalized_word,
    ],
    casts_resolved_count: input.previous.casts_resolved_count + 1,
  };

  if (updated_after_valid.creature.hp_current === 0) {
    return {
      ...updated_after_valid,
      session_state: "won",
      terminal_reason_code: "normal_win",
    };
  }

  if (
    updated_after_valid.session_state === "in_progress" &&
    updated_after_valid.moves_remaining === 0
  ) {
    return {
      ...updated_after_valid,
      session_state: "lost",
      terminal_reason_code: "moves_exhausted",
    };
  }

  if (input.did_hit_unrecoverable_dead_board) {
    return {
      ...updated_after_valid,
      session_state: "recoverable_error",
      terminal_reason_code: "spark_shuffle_retry_cap_unrecoverable",
    };
  }

  if (updated_after_valid.session_state === "won") {
    return {
      ...updated_after_valid,
      terminal_reason_code: "normal_win",
    };
  }

  return updated_after_valid;
};

const deriveDelta = (
  before_state: EncounterRuntimeState,
  after_state: EncounterRuntimeState,
): EncounterStateDelta => ({
  session_state_before: before_state.session_state,
  session_state_after: after_state.session_state,
  moves_remaining_before: before_state.moves_remaining,
  moves_remaining_after: after_state.moves_remaining,
  creature_hp_before: before_state.creature.hp_current,
  creature_hp_after: after_state.creature.hp_current,
  countdown_before: before_state.creature.spell_countdown_current,
  countdown_after: after_state.creature.spell_countdown_current,
  repeated_words_count_before: before_state.repeated_words.length,
  repeated_words_count_after: after_state.repeated_words.length,
  terminal_reason_before: before_state.terminal_reason_code,
  terminal_reason_after: after_state.terminal_reason_code,
});

const resolveTerminal = (
  state: EncounterRuntimeState,
): HeadlessTerminalResult => {
  if (state.session_state in TERMINAL_STATE_TO_OUTCOME) {
    const terminal_state =
      state.session_state as keyof typeof TERMINAL_STATE_TO_OUTCOME;
    return {
      outcome: TERMINAL_STATE_TO_OUTCOME[terminal_state],
      terminal_reason: state.terminal_reason_code ?? "none",
    };
  }

  return {
    outcome: "recoverable_error",
    terminal_reason: "manual_abandon",
  };
};

const isTerminal = (state: EncounterSessionState): boolean =>
  state === "won" || state === "lost" || state === "recoverable_error";

const stableStringify = (value: unknown): string =>
  JSON.stringify(sortJson(value));

const sortJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => left.localeCompare(right),
  );

  return Object.fromEntries(
    entries.map(([key, nested]) => [key, sortJson(nested)]),
  );
};
