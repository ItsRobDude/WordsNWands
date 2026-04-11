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
  const won = runEncounterHeadless({
    encounter: starterEncounterFixture,
    cast_submissions: starterCastList,
  });

  const lost = runEncounterHeadless({
    encounter: firstStandardEncounterFixture,
    cast_submissions: [
      {
        selected_positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 1, col: 0 },
          { row: 1, col: 1 },
        ],
        traced_word_display: "FACE",
      },
    ],
  });

  const recoverableError = runEncounterHeadless({
    encounter: {
      ...firstStandardEncounterFixture,
      validation: {
        validation_lookup: {
          snapshot_version: "test",
          metadata: {
            snapshot_version: "test",
            language: "en",
            word_count: 1,
            tagged_word_count: 1,
            generated_at_utc: "2026-04-11T00:00:00.000Z",
          },
          hasWord: (normalized_word) => normalized_word === "zzz",
          getEntry: (normalized_word) =>
            normalized_word === "zzz"
              ? { normalized_word: "zzz", element: "flame" }
              : null,
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
        traced_word_display: "ZZZ",
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
