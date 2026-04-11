import assert from "node:assert/strict";
import test from "node:test";

import {
  restoreEncounterRuntimeState,
  serializeActiveEncounterSnapshot,
} from "../persistence/activeEncounterSnapshotAdapter.ts";
import type { CastSubmission } from "../contracts/cast.ts";
import {
  firstStandardEncounterFixture,
  starterEncounterFixture,
} from "../simulation/fixtures/headlessEncounterFixtures.ts";
import type {
  HeadlessEncounterDefinition,
  HeadlessTranscriptEntry,
} from "../simulation/runEncounterHeadless.ts";
import { runEncounterHeadless } from "../simulation/runEncounterHeadless.ts";

const VERSION_PINS = {
  battle_rules_version: "battle_rules_v1",
  board_generator_version: "board_generator_v1",
  validation_snapshot_version: "validation_snapshot_v1",
} as const;

const STARTER_SCRIPTED_CASTS: CastSubmission[] = [
  {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    traced_word_display: "CA",
  },
  {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
    traced_word_display: "CAB",
  },
];

const FIRST_STANDARD_CASTS: CastSubmission[] = [
  {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    traced_word_display: "FA",
  },
  {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
    ],
    traced_word_display: "FACE",
  },
];

const RECOVERABLE_BRANCH_CASTS: CastSubmission[] = [
  {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ],
    traced_word_display: "ZZ",
  },
  {
    selected_positions: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
    ],
    traced_word_display: "ZZZ",
  },
];

const hashRun = (terminalSnapshot: string, transcript: string): string =>
  stableHashHex(
    JSON.stringify({
      version_pins: VERSION_PINS,
      terminal_snapshot: terminalSnapshot,
      transcript,
    }),
  );

const assertTranscriptPhaseInvariants = (
  transcript: readonly HeadlessTranscriptEntry[],
): void => {
  for (const entry of transcript) {
    const { delta, cast_resolution } = entry;

    assert.equal(delta.session_state_before, "in_progress");
    assert.equal(
      ["in_progress", "won", "lost", "recoverable_error"].includes(
        delta.session_state_after,
      ),
      true,
    );

    if (cast_resolution.submission_kind === "valid") {
      assert.equal(
        delta.moves_remaining_before - delta.moves_remaining_after,
        1,
      );
      assert.equal(
        delta.repeated_words_count_after - delta.repeated_words_count_before,
        1,
      );
      assert.equal(delta.countdown_after, cast_resolution.countdown_after_cast);
      assert.equal(
        delta.countdown_before - delta.countdown_after,
        cast_resolution.countdown_decremented,
      );
    } else {
      assert.equal(delta.moves_remaining_before, delta.moves_remaining_after);
      assert.equal(
        delta.repeated_words_count_before,
        delta.repeated_words_count_after,
      );
      assert.equal(delta.countdown_before, delta.countdown_after);
    }
  }
};

const runWithMidRestore = (input: {
  encounter: HeadlessEncounterDefinition;
  casts: ReadonlyArray<{
    selected_positions: { row: number; col: number }[];
    traced_word_display: string;
  }>;
  restore_after_casts: number;
}) => {
  const uninterrupted = runEncounterHeadless({
    encounter: input.encounter,
    cast_submissions: input.casts,
  });

  const preRestore = runEncounterHeadless({
    encounter: input.encounter,
    cast_submissions: input.casts.slice(0, input.restore_after_casts),
  });

  const preRestoreSnapshotBeforeResume = structuredClone(
    preRestore.terminal_snapshot,
  );
  const restored = restoreEncounterRuntimeState(
    serializeActiveEncounterSnapshot(preRestore.terminal_snapshot),
  );

  const resumed = runEncounterHeadless({
    encounter: {
      ...input.encounter,
      encounter_session_id: restored.encounter_session_id,
      encounter_id: restored.encounter_id,
      encounter_seed: restored.encounter_seed,
      board: restored.board,
      creature: restored.creature,
      move_budget_total: restored.move_budget_total,
      session_state: "in_progress",
    },
    cast_submissions: input.casts.slice(input.restore_after_casts),
  });

  assert.deepEqual(
    preRestore.terminal_snapshot,
    preRestoreSnapshotBeforeResume,
  );

  return {
    uninterrupted,
    resumed,
  };
};

test("integration: starter scripted encounter full run is deterministic with save/restore", () => {
  const { uninterrupted, resumed } = runWithMidRestore({
    encounter: starterEncounterFixture,
    casts: STARTER_SCRIPTED_CASTS,
    restore_after_casts: 1,
  });

  assert.deepEqual(uninterrupted.terminal, {
    outcome: "won",
    terminal_reason: "normal_win",
  });
  assert.deepEqual(resumed.terminal, uninterrupted.terminal);
  assert.equal(uninterrupted.terminal_snapshot.moves_remaining, 1);
  assert.equal(
    uninterrupted.terminal_snapshot.creature.spell_countdown_current,
    2,
  );

  assertTranscriptPhaseInvariants(uninterrupted.transcript);

  const runHash = hashRun(
    uninterrupted.deterministic_serialized.terminal_snapshot,
    uninterrupted.deterministic_serialized.transcript,
  );
  const repeatedHash = hashRun(
    runEncounterHeadless({
      encounter: starterEncounterFixture,
      cast_submissions: STARTER_SCRIPTED_CASTS,
    }).deterministic_serialized.terminal_snapshot,
    runEncounterHeadless({
      encounter: starterEncounterFixture,
      cast_submissions: STARTER_SCRIPTED_CASTS,
    }).deterministic_serialized.transcript,
  );
  assert.equal(runHash, "571ebba0");
  assert.equal(runHash, repeatedHash);
});

test("integration: first standard encounter full run is deterministic with save/restore", () => {
  const { uninterrupted, resumed } = runWithMidRestore({
    encounter: firstStandardEncounterFixture,
    casts: FIRST_STANDARD_CASTS,
    restore_after_casts: 1,
  });

  assert.deepEqual(uninterrupted.terminal, {
    outcome: "lost",
    terminal_reason: "moves_exhausted",
  });
  assert.deepEqual(resumed.terminal, uninterrupted.terminal);
  assert.equal(uninterrupted.terminal_snapshot.moves_remaining, 0);
  assert.equal(
    uninterrupted.terminal_snapshot.creature.spell_countdown_current,
    1,
  );

  assertTranscriptPhaseInvariants(uninterrupted.transcript);

  const runHash = hashRun(
    uninterrupted.deterministic_serialized.terminal_snapshot,
    uninterrupted.deterministic_serialized.transcript,
  );
  const repeatedHash = hashRun(
    runEncounterHeadless({
      encounter: firstStandardEncounterFixture,
      cast_submissions: FIRST_STANDARD_CASTS,
    }).deterministic_serialized.terminal_snapshot,
    runEncounterHeadless({
      encounter: firstStandardEncounterFixture,
      cast_submissions: FIRST_STANDARD_CASTS,
    }).deterministic_serialized.transcript,
  );
  assert.equal(runHash, "ead14add");
  assert.equal(runHash, repeatedHash);
});

test("integration: recoverable-error Spark Shuffle branch remains deterministic with save/restore", () => {
  const recoverableEncounter: HeadlessEncounterDefinition = {
    ...firstStandardEncounterFixture,
    validation: {
      validation_lookup: {
        snapshot_version: "recoverable",
        metadata: {
          snapshot_version: "recoverable",
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
  };

  const { uninterrupted, resumed } = runWithMidRestore({
    encounter: recoverableEncounter,
    casts: RECOVERABLE_BRANCH_CASTS,
    restore_after_casts: 1,
  });

  assert.deepEqual(uninterrupted.terminal, {
    outcome: "recoverable_error",
    terminal_reason: "spark_shuffle_retry_cap_unrecoverable",
  });
  assert.deepEqual(resumed.terminal, uninterrupted.terminal);
  assert.equal(uninterrupted.terminal_snapshot.moves_remaining, 0);
  assert.equal(
    uninterrupted.terminal_snapshot.creature.spell_countdown_current,
    1,
  );

  assertTranscriptPhaseInvariants(uninterrupted.transcript);

  const runHash = hashRun(
    uninterrupted.deterministic_serialized.terminal_snapshot,
    uninterrupted.deterministic_serialized.transcript,
  );
  const repeatedHash = hashRun(
    runEncounterHeadless({
      encounter: recoverableEncounter,
      cast_submissions: RECOVERABLE_BRANCH_CASTS,
    }).deterministic_serialized.terminal_snapshot,
    runEncounterHeadless({
      encounter: recoverableEncounter,
      cast_submissions: RECOVERABLE_BRANCH_CASTS,
    }).deterministic_serialized.transcript,
  );
  assert.equal(runHash, "1082ff26");
  assert.equal(runHash, repeatedHash);
});

const stableHashHex = (input: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
