import assert from "node:assert/strict";
import test from "node:test";

import type { ValidationSnapshotLookup } from "../../../../validation/src/index.ts";

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

const createLookup = (): ValidationSnapshotLookup => ({
  snapshot_version: "test",
  metadata: {
    snapshot_version: "test",
    language: "en",
    word_count: 1,
    tagged_word_count: 1,
    generated_at_utc: "2026-04-11T00:00:00.000Z",
  },
  hasWord: (normalizedWord) =>
    normalizedWord === "cab" || normalizedWord === "abc",
  hasPrefix: (normalizedWord) =>
    normalizedWord === "a" ||
    normalizedWord === "ab" ||
    normalizedWord === "abc" ||
    normalizedWord === "c" ||
    normalizedWord === "ca" ||
    normalizedWord === "cab",
  getEntry: (normalizedWord) =>
    normalizedWord === "abc"
      ? { normalized_word: "abc", element: "flame" }
      : normalizedWord === "cab"
        ? { normalized_word: "cab", element: "flame" }
        : null,
  getMaxWordLength: () => 3,
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
    validation_lookup: createLookup(),
  });

  assert.equal(result.cast_resolution.submission_kind, "repeated");
  assert.equal(result.cast_resolution.rejection_reason, "repeated_word");
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
    validation_lookup: createLookup(),
  });
  const second = validateCastSubmission({
    encounter_state,
    submission,
    validation_lookup: createLookup(),
  });

  assert.deepEqual({ encounter_state, submission }, before);
  assert.deepEqual(first, second);
  assert.equal(first.cast_resolution.submission_kind, "valid");
  if (first.cast_resolution.submission_kind !== "valid") {
    throw new Error("Expected deterministic cast to resolve as valid.");
  }
  assert.equal(first.cast_resolution.matchup_result, "weakness");
  assert.equal(first.cast_resolution.countdown_decremented, 0);
});

test("validateCastSubmission recomputes committed word from selected tiles instead of trusting caller text", () => {
  const encounter_state = createEncounterState();

  const result = validateCastSubmission({
    encounter_state: {
      ...encounter_state,
      repeated_words: [],
    },
    submission: {
      selected_positions: [
        { row: 1, col: 0 },
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      traced_word_display: "ZZZ",
    },
    validation_lookup: createLookup(),
  });

  assert.equal(result.normalized_word, "cab");
  assert.equal(result.cast_resolution.submission_kind, "valid");
  if (result.cast_resolution.submission_kind !== "valid") {
    throw new Error("Expected board-derived cast to resolve as valid.");
  }
  assert.equal(result.cast_resolution.normalized_word, "cab");
});

test("validateCastSubmission rejects selections that do not map to active board tiles", () => {
  const encounter_state = createEncounterState();

  const result = validateCastSubmission({
    encounter_state,
    submission: {
      selected_positions: [
        { row: 9, col: 9 },
        { row: 0, col: 0 },
      ],
      traced_word_display: "AA",
    },
    validation_lookup: createLookup(),
  });

  assert.equal(result.cast_resolution.submission_kind, "invalid");
  assert.equal(result.cast_resolution.rejection_reason, "illegal_path");
});
