import assert from "node:assert/strict";
import test from "node:test";

import type { EncounterRuntimeState } from "../../contracts/board.js";
import { runSparkShuffle } from "../runSparkShuffle.ts";

const createEncounterState = (): EncounterRuntimeState => ({
  encounter_session_id: "shuffle-session",
  encounter_id: "shuffle-encounter",
  encounter_seed: "shuffle-seed",
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
        state: "bubble",
        state_turns_remaining: 1,
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
    display_name: "Shuffle Beast",
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
  spark_shuffle_retry_cap: 3,
  spark_shuffle_retries_attempted: 0,
  spark_shuffle_fallback_outcome: "none",
  content_version_pin: "content_test_v1",
  validation_snapshot_version_pin: "validation_test_v1",
  battle_rules_version_pin: "battle_rules_test_v1",
  board_generator_version_pin: "board_generator_test_v1",
  reward_constants_version_pin: "reward_constants_test_v1",
  damage_model_version: "damage_model_v1",
  updated_at_utc: "2026-04-11T00:00:00.000Z",
});

test("runSparkShuffle recovers a playable board while preserving tile identity and tile states", () => {
  const result = runSparkShuffle({
    encounter_state: createEncounterState(),
    has_playable_word: (board) =>
      board.tiles
        .slice()
        .sort((left, right) => left.position.col - right.position.col)
        .map((tile) => tile.letter)
        .join("") === "CAB",
    next_random_index: (() => {
      const draws = [1, 0];
      return () => draws.shift() ?? 0;
    })(),
  });

  const ordered = result.encounter_state.board.tiles
    .slice()
    .sort((left, right) => left.position.col - right.position.col);

  assert.equal(result.metadata.did_recover_playable_state, true);
  assert.equal(result.encounter_state.spark_shuffle_retries_attempted, 1);
  assert.equal(result.encounter_state.spark_shuffle_fallback_outcome, "none");
  assert.deepEqual(
    ordered.map((tile) => ({ id: tile.id, letter: tile.letter, state: tile.state })),
    [
      { id: "c", letter: "C", state: null },
      { id: "a", letter: "A", state: null },
      { id: "b", letter: "B", state: "bubble" },
    ],
  );
});

test("runSparkShuffle reaches recoverable error after retry cap when no playable recovery exists", () => {
  const result = runSparkShuffle({
    encounter_state: createEncounterState(),
    has_playable_word: () => false,
    next_random_index: () => 0,
    max_shuffle_retries_per_recovery_cycle: 3,
  });

  assert.equal(result.metadata.did_hit_retry_cap, true);
  assert.equal(result.metadata.retries_attempted, 3);
  assert.equal(result.encounter_state.session_state, "recoverable_error");
  assert.equal(
    result.encounter_state.spark_shuffle_fallback_outcome,
    "recoverable_error_end",
  );
  assert.equal(
    result.encounter_state.terminal_reason_code,
    "spark_shuffle_retry_cap_unrecoverable",
  );
});
