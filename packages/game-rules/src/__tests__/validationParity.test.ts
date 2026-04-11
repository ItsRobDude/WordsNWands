import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryValidationSnapshotLookup,
  hasPlayableWord as hasPlayableWordFromValidation,
  normalizeTracedBoardLetters,
  normalizeWord,
  resolveElementForWord,
} from "../../../validation/src/index.ts";

import { hasPlayableWord } from "../board/hasPlayableWord.ts";
import type { EncounterRuntimeState } from "../contracts/board.js";
import { validateCastSubmission } from "../encounter/validateCastSubmission.ts";

const lookup = new InMemoryValidationSnapshotLookup({
  metadata: {
    snapshot_version: "parity",
    language: "en",
    word_count: 3,
    tagged_word_count: 1,
    generated_at_utc: "2026-04-11T00:00:00.000Z",
  },
  castable_words: ["cab", "ace", "leaf"],
  element_tags: { leaf: "bloom" },
});

const encounter_state: EncounterRuntimeState = {
  encounter_session_id: "parity-session",
  encounter_id: "parity-encounter",
  encounter_seed: "seed",
  board: {
    width: 2,
    height: 2,
    tiles: [
      {
        id: "c",
        letter: "C",
        position: { row: 0, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "a",
        letter: "A",
        position: { row: 0, col: 1 },
        state: null,
        special_marker: null,
      },
      {
        id: "b",
        letter: "B",
        position: { row: 1, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "x",
        letter: "X",
        position: { row: 1, col: 1 },
        state: "frozen",
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
    weakness_element: "bloom",
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
};

test("parity: normalization and word acceptance use validation behavior", () => {
  const normalized = normalizeWord("  LEAF ");
  assert.equal(normalized, "leaf");
  assert.equal(lookup.hasWord(normalized), true);
  assert.equal(normalizeTracedBoardLetters(["L", "E", "A", "F"]), "leaf");
});

test("parity: repeated-word rejection matches canonical lookup acceptance", () => {
  const result = validateCastSubmission({
    encounter_state,
    submission: {
      selected_positions: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
      ],
      traced_word_display: "CAB",
    },
    validation_lookup: lookup,
  });

  assert.equal(lookup.hasWord("cab"), true);
  assert.equal(result.cast_resolution.submission_kind, "repeated");
  assert.equal(result.cast_resolution.rejection_reason, "repeated_word");
});

test("parity: element resolution uses validation entry lookup", () => {
  assert.equal(resolveElementForWord("leaf", lookup), "bloom");

  const result = validateCastSubmission({
    encounter_state: {
      ...encounter_state,
      repeated_words: [],
      board: {
        ...encounter_state.board,
        tiles: [
          {
            id: "l",
            letter: "L",
            position: { row: 0, col: 0 },
            state: null,
            special_marker: null,
          },
          {
            id: "e",
            letter: "E",
            position: { row: 0, col: 1 },
            state: null,
            special_marker: null,
          },
          {
            id: "a",
            letter: "A",
            position: { row: 1, col: 0 },
            state: null,
            special_marker: null,
          },
          {
            id: "f",
            letter: "F",
            position: { row: 1, col: 1 },
            state: null,
            special_marker: null,
          },
        ],
      },
    },
    submission: {
      selected_positions: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 },
      ],
      traced_word_display: "LEAF",
    },
    validation_lookup: lookup,
  });

  assert.equal(result.cast_resolution.submission_kind, "valid");
  if (result.cast_resolution.submission_kind !== "valid") {
    throw new Error("Expected validation parity cast to resolve as valid.");
  }
  assert.equal(result.cast_resolution.element, "bloom");
});

test("parity: dead-board detection mirrors canonical validation helper", () => {
  const boardInput = {
    board: encounter_state.board,
    repeated_words: [],
    validation_lookup: lookup,
  };

  const gameRulesDecision = hasPlayableWord(boardInput);
  const canonicalDecision = hasPlayableWordFromValidation({
    board: [
      [
        { letter: "C", blocked: false },
        { letter: "A", blocked: false },
      ],
      [
        { letter: "B", blocked: false },
        { letter: "X", blocked: true },
      ],
    ],
    repeated_words: new Set(),
    validation_lookup: lookup,
  });

  assert.equal(gameRulesDecision, canonicalDecision);
  assert.equal(gameRulesDecision, true);
});
