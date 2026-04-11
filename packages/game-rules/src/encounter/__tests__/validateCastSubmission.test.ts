import assert from "node:assert/strict";
import test from "node:test";

import type { EncounterRuntimeState } from "../../contracts/board.js";
import { validateCastSubmission } from "../validateCastSubmission.ts";

const createEncounterState = (): EncounterRuntimeState => ({
  encounter_session_id: "s1",
  encounter_id: "e1",
  encounter_seed: "seed",
  board: {
    width: 2,
    height: 2,
    tiles: [
      {
        id: "a",
        letter: "A",
        position: { row: 0, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "b",
        letter: "B",
        position: { row: 0, col: 1 },
        state: null,
        special_marker: null,
      },
      {
        id: "c",
        letter: "C",
        position: { row: 1, col: 0 },
        state: null,
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
    creature_id: "cr",
    display_name: "Wisp",
    encounter_type: "standard",
    difficulty_tier: "standard",
    weakness_element: "flame",
    resistance_element: "tide",
    hp_current: 20,
    hp_max: 20,
    spell_countdown_current: 2,
    spell_countdown_reset: 3,
  },
  session_state: "in_progress",
  terminal_reason_code: null,
  moves_remaining: 5,
  move_budget_total: 5,
  repeated_words: ["cab"],
  casts_resolved_count: 0,
  spark_shuffle_retry_count: 0,
  updated_at_utc: "2026-04-11T00:00:00.000Z",
});

test("validateCastSubmission returns repeated for repeated words", () => {
  const encounter_state = createEncounterState();

  const result = validateCastSubmission({
    encounter_state,
    submission: {
      selected_positions: [
        { row: 1, col: 0 },
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      traced_word_display: "CAB",
    },
    has_word: () => true,
  });

  assert.equal(result.cast_resolution.submission_kind, "repeated");
  if (result.cast_resolution.submission_kind !== "valid") {
    assert.equal(result.cast_resolution.rejection_reason, "repeated_word");
  }
});

test("validateCastSubmission deterministic valid output and no mutation", () => {
  const encounter_state = createEncounterState();
  const submission = {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
    traced_word_display: "abc",
  };
  const before = structuredClone({ encounter_state, submission });

  const first = validateCastSubmission({
    encounter_state,
    submission,
    has_word: () => true,
    resolve_element: () => "flame",
  });
  const second = validateCastSubmission({
    encounter_state,
    submission,
    has_word: () => true,
    resolve_element: () => "flame",
  });

  assert.deepEqual({ encounter_state, submission }, before);
  assert.deepEqual(first, second);
  assert.equal(first.cast_resolution.submission_kind, "valid");
  if (first.cast_resolution.submission_kind === "valid") {
    assert.equal(first.cast_resolution.matchup_result, "weakness");
    assert.equal(first.cast_resolution.countdown_decremented, 0);
  }
});
