import assert from "node:assert/strict";
import test from "node:test";
import type { EncounterRuntimeState } from "../../contracts/board.ts";
import type { CastSubmission } from "../../contracts/cast.ts";
import { applyCastSubmission } from "../../encounter/applyCastSubmission.ts";
import { createEncounterRuntimeState } from "../../encounter/createEncounterRuntimeState.ts";
import {
  restoreEncounterRuntimeState,
  serializeActiveEncounterSnapshot,
} from "../activeEncounterSnapshotAdapter.ts";

const advanceStream = (state: string, label: string): string =>
  `${state}->${label}`;

const createInitialState = (): EncounterRuntimeState =>
  createEncounterRuntimeState({
    encounter_session_id: "session-001",
    encounter_id: "encounter-001",
    encounter_seed: "seed-001",
    move_budget_total: 4,
    session_state: "in_progress",
    updated_at_utc: "2026-01-01T00:00:00.000Z",
    board: {
      width: 2,
      height: 2,
      tiles: [
        {
          id: "tile-0",
          letter: "A",
          position: { row: 0, col: 0 },
          state: null,
          special_marker: null,
        },
      ],
    },
    creature: {
      creature_id: "creature-001",
      display_name: "Adapter Beast",
      encounter_type: "standard",
      difficulty_tier: "standard",
      weakness_element: "flame",
      resistance_element: "tide",
      hp_current: 3,
      hp_max: 3,
      spell_countdown_current: 3,
      spell_countdown_reset: 3,
    },
  });

const runSingleCast = (
  encounter_state: EncounterRuntimeState,
  submission: CastSubmission,
): EncounterRuntimeState => {
  const result = applyCastSubmission({
    encounter_state,
    submission,
    dependencies: {
      validate_submission: ({ submission }) => ({
        cast_resolution: {
          submission_kind: "valid",
          normalized_word: submission.traced_word_display.toLowerCase(),
          element: "flame",
          matchup_result: "neutral",
          damage_applied: 1,
          countdown_after_cast: Math.max(
            0,
            encounter_state.creature.spell_countdown_current - 1,
          ),
          countdown_decremented: 1,
          moves_remaining_after_cast: Math.max(
            0,
            encounter_state.moves_remaining - 1,
          ),
        },
        normalized_word: submission.traced_word_display.toLowerCase(),
      }),
      resolve_element_and_wand: () => ({
        element: "flame",
        used_wand_tile: false,
      }),
      consume_tiles: ({ board }) => board,
      collapse_columns: ({ board }) => board,
      refill_board: ({ board, rng_stream_states }) => ({
        board,
        rng_stream_states: {
          ...rng_stream_states,
          board_fill_stream_state: advanceStream(
            rng_stream_states.board_fill_stream_state,
            "refill",
          ),
        },
      }),
      apply_bubble_rise: ({ board }) => board,
      compute_damage: ({ cast_resolution, encounter_state }) => ({
        cast_resolution,
        creature: encounter_state.creature,
      }),
      apply_hp: ({ damage_result }) => {
        const hp_current = Math.max(0, damage_result.creature.hp_current - 1);
        return {
          cast_resolution: damage_result.cast_resolution,
          creature: {
            ...damage_result.creature,
            hp_current,
          },
          did_win: hp_current === 0,
        };
      },
      evaluate_countdown: ({ creature }) => ({
        creature: {
          ...creature,
          spell_countdown_current: Math.max(
            0,
            creature.spell_countdown_current - 1,
          ),
        },
        did_trigger_creature_spell: false,
      }),
      apply_creature_spell: ({ board, creature, rng_stream_states }) => ({
        board,
        creature,
        rng_stream_states: {
          ...rng_stream_states,
          creature_spell_stream_state: advanceStream(
            rng_stream_states.creature_spell_stream_state,
            "spell",
          ),
        },
      }),
      tick_surviving_tile_states: ({ board }) => board,
      detect_dead_board: () => ({ is_dead_board: false }),
      run_spark_shuffle_recovery: ({
        encounter_state,
        board,
        creature,
        rng_stream_states,
      }) => ({
        encounter_state: {
          ...encounter_state,
          creature,
          board: {
            ...board,
            rng_stream_states: {
              ...rng_stream_states,
              spark_shuffle_stream_state: advanceStream(
                rng_stream_states.spark_shuffle_stream_state,
                "shuffle",
              ),
            },
          },
        },
      }),
    },
  });

  const is_terminal = result.encounter_state.creature.hp_current === 0;

  return {
    ...result.encounter_state,
    moves_remaining: Math.max(0, encounter_state.moves_remaining - 1),
    repeated_words: [
      ...encounter_state.repeated_words,
      submission.traced_word_display.toLowerCase(),
    ],
    casts_resolved_count: encounter_state.casts_resolved_count + 1,
    session_state: is_terminal ? "won" : "in_progress",
    terminal_reason_code: is_terminal ? "normal_win" : null,
    updated_at_utc: `2026-01-01T00:00:${String(encounter_state.casts_resolved_count + 1).padStart(2, "0")}.000Z`,
  };
};

const runCasts = (
  state: EncounterRuntimeState,
  submissions: readonly CastSubmission[],
): EncounterRuntimeState =>
  submissions.reduce(
    (current, submission) =>
      current.session_state === "in_progress"
        ? runSingleCast(current, submission)
        : current,
    state,
  );

test("save+restore mid-run reaches identical terminal state as uninterrupted run", () => {
  const submissions: CastSubmission[] = [
    { traced_word_display: "ONE", selected_positions: [] },
    { traced_word_display: "TWO", selected_positions: [] },
    { traced_word_display: "THREE", selected_positions: [] },
  ];

  const uninterrupted_terminal = runCasts(createInitialState(), submissions);

  const mid_state = runCasts(createInitialState(), submissions.slice(0, 1));
  const serialized = serializeActiveEncounterSnapshot(mid_state);
  const restored_mid_state = restoreEncounterRuntimeState(serialized);
  const resumed_terminal = runCasts(restored_mid_state, submissions.slice(1));

  assert.deepEqual(resumed_terminal, uninterrupted_terminal);
});

test("restore preserves RNG stream continuity for subsequent casts", () => {
  const submissions: CastSubmission[] = [
    { traced_word_display: "ONE", selected_positions: [] },
    { traced_word_display: "TWO", selected_positions: [] },
  ];

  const mid_state = runCasts(createInitialState(), submissions.slice(0, 1));
  const restored_mid_state = restoreEncounterRuntimeState(
    serializeActiveEncounterSnapshot(mid_state),
  );

  const continued_from_original = runCasts(mid_state, submissions.slice(1));
  const continued_from_restored = runCasts(
    restored_mid_state,
    submissions.slice(1),
  );

  assert.deepEqual(
    continued_from_restored.board.rng_stream_states,
    continued_from_original.board.rng_stream_states,
  );
});

test("terminal snapshot restore uses terminal semantics instead of in-progress replay", () => {
  const terminal_state = runCasts(createInitialState(), [
    { traced_word_display: "ONE", selected_positions: [] },
    { traced_word_display: "TWO", selected_positions: [] },
    { traced_word_display: "THREE", selected_positions: [] },
  ]);

  const serialized_terminal = serializeActiveEncounterSnapshot(terminal_state);
  const replay_like_runtime_json = JSON.stringify({
    ...terminal_state,
    session_state: "in_progress",
    terminal_reason_code: null,
  });

  const restored_terminal = restoreEncounterRuntimeState({
    ...serialized_terminal,
    runtime_state_json: replay_like_runtime_json,
  });

  assert.equal(restored_terminal.session_state, "won");
  assert.equal(restored_terminal.terminal_reason_code, "normal_win");
});
