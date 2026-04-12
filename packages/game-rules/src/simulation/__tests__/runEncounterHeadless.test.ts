import assert from "node:assert/strict";
import test from "node:test";

import {
  firstStandardEncounterFixture,
  starterEncounterFixture,
} from "../fixtures/headlessEncounterFixtures.ts";
import { runEncounterHeadless } from "../runEncounterHeadless.ts";

const starterCastList = [
  {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
    traced_word_display: "CAB",
  },
];

test("runEncounterHeadless emits byte-identical snapshot and transcript for same seed and cast list", () => {
  const first = runEncounterHeadless({
    encounter: starterEncounterFixture,
    cast_submissions: starterCastList,
  });
  const second = runEncounterHeadless({
    encounter: starterEncounterFixture,
    cast_submissions: starterCastList,
  });

  assert.equal(
    first.deterministic_serialized.terminal_snapshot,
    second.deterministic_serialized.terminal_snapshot,
  );
  assert.equal(
    first.deterministic_serialized.transcript,
    second.deterministic_serialized.transcript,
  );
  assert.equal(first.terminal.outcome, "won");
  assert.equal(first.terminal.terminal_reason, "normal_win");
});

test("runEncounterHeadless diverges deterministically for changed cast list", () => {
  const winningRun = runEncounterHeadless({
    encounter: starterEncounterFixture,
    cast_submissions: starterCastList,
  });

  const repeatedRun = runEncounterHeadless({
    encounter: starterEncounterFixture,
    cast_submissions: [
      {
        selected_positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
        traced_word_display: "CA",
      },
      starterCastList[0],
    ],
  });

  assert.notEqual(
    winningRun.deterministic_serialized.transcript,
    repeatedRun.deterministic_serialized.transcript,
  );
  assert.notEqual(
    winningRun.deterministic_serialized.terminal_snapshot,
    repeatedRun.deterministic_serialized.terminal_snapshot,
  );
});

test("runEncounterHeadless terminal reason semantics parity for won, lost, and recoverable_error", () => {
  const impossibleWordPrefixes = new Set(["z", "zz", "zzz"]);
  const lossLookup = {
    snapshot_version: "loss-test",
    metadata: {
      snapshot_version: "loss-test",
      language: "en",
      word_count: 2,
      tagged_word_count: 2,
      generated_at_utc: "2026-04-11T00:00:00.000Z",
    },
    hasWord: (normalized_word: string) =>
      normalized_word === "dog" || normalized_word === "cat",
    hasPrefix: (normalized_prefix: string) =>
      normalized_prefix === "d" ||
      normalized_prefix === "do" ||
      normalized_prefix === "dog" ||
      normalized_prefix === "c" ||
      normalized_prefix === "ca" ||
      normalized_prefix === "cat",
    getEntry: (normalized_word: string) =>
      normalized_word === "dog" || normalized_word === "cat"
        ? { normalized_word, element: "flame" as const }
        : null,
    getMaxWordLength: () => 3,
  } as const;

  const won = runEncounterHeadless({
    encounter: starterEncounterFixture,
    cast_submissions: starterCastList,
  });

  const lost = runEncounterHeadless({
    encounter: {
      ...firstStandardEncounterFixture,
      encounter_session_id: "loss-session-001",
      encounter_id: "encounter-loss-001",
      encounter_seed: "loss-seed-001",
      board: {
        width: 3,
        height: 2,
        tiles: [
          {
            id: "loss-0-0",
            letter: "D",
            position: { row: 0, col: 0 },
            state: null,
            special_marker: null,
          },
          {
            id: "loss-0-1",
            letter: "O",
            position: { row: 0, col: 1 },
            state: null,
            special_marker: null,
          },
          {
            id: "loss-0-2",
            letter: "G",
            position: { row: 0, col: 2 },
            state: null,
            special_marker: null,
          },
          {
            id: "loss-1-0",
            letter: "C",
            position: { row: 1, col: 0 },
            state: null,
            special_marker: null,
          },
          {
            id: "loss-1-1",
            letter: "A",
            position: { row: 1, col: 1 },
            state: null,
            special_marker: null,
          },
          {
            id: "loss-1-2",
            letter: "T",
            position: { row: 1, col: 2 },
            state: null,
            special_marker: null,
          },
        ],
      },
      letter_pool: ["D", "O", "G", "C", "A", "T"],
      move_budget_total: 1,
      creature: {
        ...firstStandardEncounterFixture.creature,
        hp_current: 20,
        hp_max: 20,
        spell_countdown_current: 5,
        spell_countdown_reset: 5,
      },
      validation: {
        validation_lookup: lossLookup,
      },
    },
    cast_submissions: [
      {
        selected_positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
        ],
        traced_word_display: "DOG",
      },
    ],
  });

  const recoverableError = runEncounterHeadless({
    encounter: {
      ...starterEncounterFixture,
      move_budget_total: 1,
      creature: {
        ...starterEncounterFixture.creature,
        hp_current: 20,
        hp_max: 20,
        spell_countdown_current: 5,
        spell_countdown_reset: 5,
      },
      validation: {
        validation_lookup: {
          snapshot_version: "recoverable-error-test",
          metadata: {
            snapshot_version: "recoverable-error-test",
            language: "en",
            word_count: 1,
            tagged_word_count: 1,
            generated_at_utc: "2026-04-11T00:00:00.000Z",
          },
          hasWord: (normalized_word) => normalized_word === "cab",
          hasPrefix: (normalized_prefix) =>
            impossibleWordPrefixes.has(normalized_prefix) ||
            normalized_prefix === "c" ||
            normalized_prefix === "ca" ||
            normalized_prefix === "cab",
          getEntry: (normalized_word) =>
            normalized_word === "cab"
              ? { normalized_word: "cab", element: "flame" }
              : null,
          getMaxWordLength: () => 3,
        },
      },
    },
    cast_submissions: [
      {
        selected_positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 0 },
        ],
        traced_word_display: "CAB",
      },
    ],
  });

  assert.deepEqual(won.terminal, {
    outcome: "won",
    terminal_reason: "normal_win",
  });
  assert.deepEqual(lost.terminal, {
    outcome: "lost",
    terminal_reason: "moves_exhausted",
  });
  assert.deepEqual(recoverableError.terminal, {
    outcome: "recoverable_error",
    terminal_reason: "spark_shuffle_retry_cap_unrecoverable",
  });
});
