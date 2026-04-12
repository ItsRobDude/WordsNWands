import {
  resolveElementForWord,
  type ValidationSnapshotLookup,
} from "../../../validation/src/index.ts";

import type { EncounterRuntimeState } from "../contracts/board.ts";
import type { EncounterRngStreamStates } from "../contracts/board.ts";
import type { EncounterVersionPins } from "../contracts/board.ts";
import type {
  CastResolution,
  CastSubmission,
  CreatureSpellPrimitive,
} from "../contracts/cast.ts";
import type {
  EncounterSessionState,
  EncounterTerminalReasonCode,
} from "../contracts/core.ts";
import { applyBubbleRise } from "../board/applyBubbleRise.ts";
import { collapseColumns } from "../board/collapseColumns.ts";
import { consumeTiles } from "../board/consumeTiles.ts";
import { drawUint32FromStreamState } from "../board/deterministicRng.ts";
import { hasPlayableWord } from "../board/hasPlayableWord.ts";
import { refillBoard } from "../board/refillBoard.ts";
import { selectBestBoardCandidate } from "../board/selectBestBoardCandidate.ts";
import { tickSurvivingTileStates } from "../board/tickSurvivingTileStates.ts";
import { damageModelV1 } from "../damage/damageModelV1.ts";
import { applyCastSubmission } from "../encounter/applyCastSubmission.ts";
import { applyCountdownStep } from "../encounter/applyCountdownStep.ts";
import { createEncounterRuntimeState } from "../encounter/createEncounterRuntimeState.ts";
import { validateCastSubmission } from "../encounter/validateCastSubmission.ts";
import { runSparkShuffle } from "../recovery/runSparkShuffle.ts";
import { applyCreatureSpell } from "../spells/applyCreatureSpell.ts";

export interface HeadlessEncounterDefinition {
  encounter_session_id: string;
  encounter_id: string;
  encounter_seed: string;
  board: Parameters<typeof createEncounterRuntimeState>[0]["board"];
  letter_pool?: readonly string[];
  rng_stream_states?: Partial<EncounterRngStreamStates>;
  creature: Parameters<typeof createEncounterRuntimeState>[0]["creature"];
  move_budget_total: number;
  version_pins?: Partial<EncounterVersionPins>;
  moves_remaining?: number;
  repeated_words?: readonly string[];
  casts_resolved_count?: number;
  spark_shuffle_retry_cap?: number;
  spark_shuffle_retries_attempted?: number;
  spark_shuffle_fallback_outcome?: EncounterRuntimeState["spark_shuffle_fallback_outcome"];
  updated_at_utc?: string;
  session_state?: Extract<
    EncounterSessionState,
    "unopened" | "intro_presented" | "in_progress"
  >;
  validation: {
    validation_lookup: ValidationSnapshotLookup;
    minimum_word_length?: number;
  };
  minimum_playable_word_count_after_refill?: number;
  target_playable_word_count_after_refill?: number;
  playable_word_count_search_limit_after_refill?: number;
  minimum_vowel_class_count?: number | null;
  vowel_class_includes_y?: boolean;
  refill_candidate_search_attempts?: number;
  creature_spell_primitives?: readonly CreatureSpellPrimitive[] | null;
  creature_spell_primitive?: CreatureSpellPrimitive | null;
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
    version_pins: encounter.version_pins,
    moves_remaining: encounter.moves_remaining,
    repeated_words: encounter.repeated_words,
    casts_resolved_count: encounter.casts_resolved_count,
    spark_shuffle_retry_cap: encounter.spark_shuffle_retry_cap,
    spark_shuffle_retries_attempted: encounter.spark_shuffle_retries_attempted,
    spark_shuffle_fallback_outcome: encounter.spark_shuffle_fallback_outcome,
    rng_stream_states: encounter.rng_stream_states,
    session_state: encounter.session_state ?? "in_progress",
    updated_at_utc: encounter.updated_at_utc ?? "2026-01-01T00:00:00.000Z",
  });

  const transcript: HeadlessTranscriptEntry[] = [];

  const starting_cast_index = encounter_state.casts_resolved_count;

  for (const [cast_offset, submission] of cast_submissions.entries()) {
    const cast_index = starting_cast_index + cast_offset;

    if (isTerminal(encounter_state.session_state)) {
      break;
    }

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
            compute_damage: ({
              word_length,
              matchup_result,
              cast_element,
              used_wand_tile,
              selected_tile_states,
            }) =>
              damageModelV1({
                word_length,
                matchup_result,
                cast_element,
                used_wand_tile,
                selected_tile_states,
              }).final_damage,
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
        refill_board: ({ board, rng_stream_states }) => {
          const initial_candidate = refillBoard({
            board,
            rng_stream_states,
            letter_pool: encounter.letter_pool,
          });

          if (!encounter.minimum_playable_word_count_after_refill) {
            return initial_candidate;
          }

          return selectBestBoardCandidate({
            initial_candidate,
            candidate_search_attempts:
              encounter.refill_candidate_search_attempts ?? 1,
            policy: {
              minimum_playable_word_count:
                encounter.minimum_playable_word_count_after_refill,
              target_playable_word_count:
                encounter.target_playable_word_count_after_refill ??
                encounter.minimum_playable_word_count_after_refill,
              playable_word_count_search_limit:
                encounter.playable_word_count_search_limit_after_refill,
              repeated_words: before_state.repeated_words,
              validation_lookup: encounter.validation.validation_lookup,
              minimum_length: encounter.validation.minimum_word_length,
              minimum_vowel_class_count: encounter.minimum_vowel_class_count,
              vowel_class_includes_y: encounter.vowel_class_includes_y ?? false,
            },
            next_candidate: (current_candidate) =>
              refillBoard({
                board,
                rng_stream_states: current_candidate.rng_stream_states,
                letter_pool: encounter.letter_pool,
              }),
          });
        },
        apply_bubble_rise: ({ board }) =>
          applyBubbleRise({
            board,
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
        apply_creature_spell: ({ board, creature, rng_stream_states }) => {
          const primitives =
            encounter.creature_spell_primitives ??
            (encounter.creature_spell_primitive
              ? [encounter.creature_spell_primitive]
              : []);

          if (primitives.length === 0) {
            return {
              board,
              creature,
              rng_stream_states,
            };
          }

          let spell_state: EncounterRuntimeState = {
            ...before_state,
            board: {
              ...board,
              rng_stream_states,
            },
            creature,
          };

          for (const primitive of primitives) {
            spell_state = applyCreatureSpell({
              encounter_state: spell_state,
              primitive,
            });
          }

          return {
            board: spell_state.board,
            creature,
            rng_stream_states: spell_state.board.rng_stream_states,
          };
        },
        tick_surviving_tile_states: ({ board }) =>
          tickSurvivingTileStates({
            board,
          }),
        detect_dead_board: ({ board, repeated_words }) => ({
          is_dead_board: !hasPlayableWord({
            board,
            repeated_words,
            validation_lookup: encounter.validation.validation_lookup,
          }),
        }),
        run_spark_shuffle_recovery: ({
          encounter_state: base_state,
          board,
          creature,
          rng_stream_states,
        }) => {
          let spark_shuffle_stream_state =
            rng_stream_states.spark_shuffle_stream_state;

          const recovery_result = runSparkShuffle({
            encounter_state: {
              ...base_state,
              board: {
                ...board,
                rng_stream_states,
              },
              creature,
            },
            has_playable_word: (candidate_board) =>
              hasPlayableWord({
                board: candidate_board,
                repeated_words: base_state.repeated_words,
                validation_lookup: encounter.validation.validation_lookup,
              }),
            next_random_index: (max_exclusive) => {
              const draw = drawUint32FromStreamState(
                spark_shuffle_stream_state,
              );
              spark_shuffle_stream_state = draw.next_stream_state;
              return Math.floor(
                (draw.value / 0x1_0000_0000) * Math.max(1, max_exclusive),
              );
            },
          });

          return {
            encounter_state: {
              ...recovery_result.encounter_state,
              creature,
              board: {
                ...recovery_result.encounter_state.board,
                rng_stream_states: {
                  ...rng_stream_states,
                  spark_shuffle_stream_state,
                },
              },
            },
          };
        },
      },
    });

    encounter_state = applyPostCastProgression({
      previous: before_state,
      next: result.encounter_state,
      cast_resolution: result.cast_resolution,
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

  if (updated_after_valid.session_state === "recoverable_error") {
    return updated_after_valid;
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
