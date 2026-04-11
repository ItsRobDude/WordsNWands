import assert from "node:assert/strict";
import test from "node:test";

import type { EncounterRuntimeState } from "../../contracts/board.js";
import type { CastSubmission } from "../../contracts/cast.js";
import { applyCastSubmission } from "../applyCastSubmission.ts";
import { runSparkShuffle } from "../../recovery/runSparkShuffle.ts";

const createEncounterState = (): EncounterRuntimeState => ({
  encounter_session_id: "session-001",
  encounter_id: "encounter-001",
  encounter_seed: "seed-001",
  board: {
    width: 3,
    height: 1,
    tiles: [
      {
        id: "a",
        letter: "A",
        position: { row: 0, col: 0 },
        state: null,
        state_turns_remaining: null,
        special_marker: null,
      },
      {
        id: "b",
        letter: "B",
        position: { row: 0, col: 1 },
        state: null,
        state_turns_remaining: null,
        special_marker: null,
      },
      {
        id: "c",
        letter: "C",
        position: { row: 0, col: 2 },
        state: null,
        state_turns_remaining: null,
        special_marker: null,
      },
    ],
    rng_stream_states: {
      board_fill_stream_state: "bf",
      creature_spell_stream_state: "cs",
      spark_shuffle_stream_state: "ss",
    },
  },
  creature: {
    creature_id: "creature-001",
    display_name: "Pipeline Beast",
    encounter_type: "standard",
    difficulty_tier: "standard",
    weakness_element: "flame",
    resistance_element: "tide",
    hp_current: 10,
    hp_max: 10,
    spell_countdown_current: 2,
    spell_countdown_reset: 2,
  },
  session_state: "in_progress",
  terminal_reason_code: null,
  moves_remaining: 3,
  move_budget_total: 3,
  repeated_words: [],
  casts_resolved_count: 0,
  spark_shuffle_retry_count: 0,
  updated_at_utc: "2026-04-11T00:00:00.000Z",
});

test("applyCastSubmission routes dead-board recovery through runSparkShuffle and returns the recovered playable board", () => {
  const encounter_state = createEncounterState();
  const submission: CastSubmission = {
    traced_word_display: "abc",
    selected_positions: [{ row: 0, col: 0 }],
  };

  const result = applyCastSubmission({
    encounter_state,
    submission,
    dependencies: {
      validate_submission: () => ({
        cast_resolution: {
          submission_kind: "valid",
          normalized_word: "abc",
          element: "flame",
          matchup_result: "neutral",
          damage_applied: 1,
          countdown_after_cast: 1,
          countdown_decremented: 1,
          moves_remaining_after_cast: 2,
        },
        normalized_word: "abc",
      }),
      resolve_element_and_wand: () => ({
        element: "flame",
        used_wand_tile: false,
      }),
      consume_tiles: ({ board }) => board,
      collapse_columns: ({ board }) => board,
      refill_board: ({ board, rng_stream_states }) => ({
        board,
        rng_stream_states,
      }),
      apply_bubble_rise: ({ board }) => board,
      compute_damage: ({ cast_resolution, encounter_state }) => ({
        cast_resolution,
        creature: encounter_state.creature,
      }),
      apply_hp: ({ damage_result }) => ({
        cast_resolution: damage_result.cast_resolution,
        creature: damage_result.creature,
        did_win: false,
      }),
      evaluate_countdown: ({ creature }) => ({
        creature,
        did_trigger_creature_spell: false,
      }),
      apply_creature_spell: ({ board, creature, rng_stream_states }) => ({
        board,
        creature,
        rng_stream_states,
      }),
      tick_surviving_tile_states: ({ board }) => board,
      detect_dead_board: ({ board }) => ({
        is_dead_board:
          board.tiles
            .slice()
            .sort((left, right) => left.position.col - right.position.col)
            .map((tile) => tile.letter)
            .join("") !== "CAB",
      }),
      run_spark_shuffle_recovery: ({
        encounter_state,
        board,
        creature,
        rng_stream_states,
      }) => {
        const random_indices = [1, 0];
        const recovery = runSparkShuffle({
          encounter_state: {
            ...encounter_state,
            creature,
            board: {
              ...board,
              rng_stream_states,
            },
          },
          has_playable_word: (candidate_board) =>
            candidate_board.tiles
              .slice()
              .sort((left, right) => left.position.col - right.position.col)
              .map((tile) => tile.letter)
              .join("") === "CAB",
          next_random_index: () => random_indices.shift() ?? 0,
        });

        return {
          encounter_state: recovery.encounter_state,
        };
      },
    },
  });

  assert.equal(result.encounter_state.session_state, "in_progress");
  assert.equal(result.encounter_state.spark_shuffle_retry_count, 1);
  assert.deepEqual(
    result.encounter_state.board.tiles
      .slice()
      .sort((left, right) => left.position.col - right.position.col)
      .map((tile) => tile.letter),
    ["C", "A", "B"],
  );
});
