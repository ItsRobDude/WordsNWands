import assert from "node:assert/strict";
import test from "node:test";

import { createLocalContentPackageLoader } from "../../../content/src/runtime/localContentPackageLoader.js";
import {
  InMemoryValidationSnapshotLookup,
  resolveElementForWord,
  type RuntimeValidationSnapshot,
} from "../../../validation/src/index.ts";
import {
  restoreEncounterRuntimeState,
  serializeActiveEncounterSnapshot,
} from "../persistence/activeEncounterSnapshotAdapter.ts";
import type { BoardPosition } from "../contracts/board.ts";
import type {
  CastSubmission,
  CreatureSpellPrimitive,
} from "../contracts/cast.ts";
import type { ElementType } from "../contracts/core.ts";
import type {
  HeadlessEncounterDefinition,
  HeadlessTranscriptEntry,
} from "../simulation/runEncounterHeadless.ts";
import { runEncounterHeadless } from "../simulation/runEncounterHeadless.ts";

interface AuthoredEncounterPayload {
  id: string;
  contentVersion: string;
  creature: {
    id: string;
    displayName: string;
    encounterType: "standard" | "boss" | "event";
    difficultyTier: "gentle" | "standard" | "challenging" | "boss" | "event";
    maxHp: number;
    weakness: ElementType;
    resistance: ElementType;
    baseCountdown: number;
    spellPrimitives: CreatureSpellPrimitive[];
  };
  encounter: {
    id: string;
    moveBudget: number;
    starterTutorialScript: {
      guidedFirstCast: {
        normalizedWord: string;
        selectedPositions: BoardPosition[];
        expectedElement: ElementType;
      };
      starterBoardOpening: {
        postFirstSpellWeaknessTeachingTarget: {
          normalizedWord: string;
          expectedElement: ElementType;
          availabilityRule: "required_immediately_after_first_creature_spell";
        };
      };
    } | null;
  };
}

const CONTENT_LOADER = createLocalContentPackageLoader();
const CONTENT_MANIFEST = CONTENT_LOADER.loadManifest();
const AUTHORED_VALIDATION_SNAPSHOT =
  CONTENT_LOADER.loadValidationSnapshot() as RuntimeValidationSnapshot;
const AUTHORED_VALIDATION_LOOKUP = new InMemoryValidationSnapshotLookup(
  AUTHORED_VALIDATION_SNAPSHOT,
);
const STARTER_PAYLOAD = CONTENT_LOADER.loadEncounterById(
  "enc_starter_001",
) as AuthoredEncounterPayload;
const MEADOW_PAYLOAD = CONTENT_LOADER.loadEncounterById(
  "enc_meadow_001",
) as AuthoredEncounterPayload;

const VERSION_PINS = {
  content_version: CONTENT_MANIFEST.content_version,
  battle_rules_version: CONTENT_MANIFEST.battle_rules_version,
  board_generator_version: CONTENT_MANIFEST.board_generator_version,
  validation_snapshot_version: CONTENT_MANIFEST.validation_snapshot_version,
  reward_constants_version: "reward_constants_unpinned",
} as const;

const STARTER_BOARD_ROWS = [
  "LEAFBE",
  "SUNGLO",
  "PATHRI",
  "VINEMO",
  "CALMST",
  "WINDRA",
] as const;

const MEADOW_BOARD_ROWS = [
  "LEAFBE",
  "SUNGLO",
  "PATHRI",
  "MAGICV",
  "INESTA",
  "RWINDM",
] as const;

const STARTER_SEED = "starter_opening_script_v1";
const MEADOW_SEED = "11112222333344445555666677778888";

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
      const countdown_delta = delta.countdown_before - delta.countdown_after;
      if (countdown_delta >= 0) {
        assert.equal(countdown_delta, cast_resolution.countdown_decremented);
      } else {
        assert.equal(cast_resolution.countdown_decremented, 1);
      }
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

const buildHeadlessEncounter = (input: {
  payload: AuthoredEncounterPayload;
  board_rows: readonly string[];
  encounter_seed: string;
  countdown_current?: number;
  hp_current?: number;
}): HeadlessEncounterDefinition => ({
  encounter_session_id: `${input.payload.id}::${input.encounter_seed}::session`,
  encounter_id: input.payload.encounter.id,
  encounter_seed: input.encounter_seed,
  board: createBoardFromRows(input.board_rows),
  creature: {
    creature_id: input.payload.creature.id,
    display_name: input.payload.creature.displayName,
    encounter_type: input.payload.creature.encounterType,
    difficulty_tier: input.payload.creature.difficultyTier,
    weakness_element: input.payload.creature.weakness,
    resistance_element: input.payload.creature.resistance,
    hp_current: input.hp_current ?? input.payload.creature.maxHp,
    hp_max: input.payload.creature.maxHp,
    spell_countdown_current:
      input.countdown_current ?? input.payload.creature.baseCountdown,
    spell_countdown_reset: input.payload.creature.baseCountdown,
  },
  move_budget_total: input.payload.encounter.moveBudget,
  version_pins: {
    content_version_pin: VERSION_PINS.content_version,
    validation_snapshot_version_pin: VERSION_PINS.validation_snapshot_version,
    battle_rules_version_pin: VERSION_PINS.battle_rules_version,
    board_generator_version_pin: VERSION_PINS.board_generator_version,
    reward_constants_version_pin: VERSION_PINS.reward_constants_version,
  },
  session_state: "in_progress",
  validation: {
    validation_lookup: AUTHORED_VALIDATION_LOOKUP,
  },
  creature_spell_primitives: input.payload.creature.spellPrimitives,
});

const createBoardFromRows = (
  rows: readonly string[],
): HeadlessEncounterDefinition["board"] => {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;

  assert.equal(height > 0, true);
  assert.equal(width > 0, true);
  assert.equal(
    rows.every((row) => row.length === width),
    true,
  );

  return {
    width,
    height,
    tiles: rows.flatMap((rowLetters, row) =>
      [...rowLetters].map((letter, col) => ({
        id: `r${row}c${col}-${letter}`,
        letter,
        position: { row, col },
        state: null,
        state_turns_remaining: null,
        special_marker: null,
      })),
    ),
  };
};

const createCastFromWordPath = (
  normalizedWord: string,
  selectedPositions: readonly BoardPosition[],
): CastSubmission => ({
  selected_positions: selectedPositions.map((position) => ({ ...position })),
  traced_word_display: normalizedWord.toUpperCase(),
});

const buildResumeEncounter = (
  template: HeadlessEncounterDefinition,
  state: ReturnType<typeof restoreEncounterRuntimeState>,
): HeadlessEncounterDefinition => ({
  ...template,
  encounter_session_id: state.encounter_session_id,
  encounter_id: state.encounter_id,
  encounter_seed: state.encounter_seed,
  board: state.board,
  rng_stream_states: state.board.rng_stream_states,
  creature: state.creature,
  move_budget_total: state.move_budget_total,
  moves_remaining: state.moves_remaining,
  repeated_words: state.repeated_words,
  casts_resolved_count: state.casts_resolved_count,
  spark_shuffle_retry_cap: state.spark_shuffle_retry_cap,
  spark_shuffle_retries_attempted: state.spark_shuffle_retries_attempted,
  spark_shuffle_fallback_outcome: state.spark_shuffle_fallback_outcome,
  updated_at_utc: state.updated_at_utc,
  session_state: "in_progress",
});

const isTerminalSessionState = (
  session_state: ReturnType<
    typeof restoreEncounterRuntimeState
  >["session_state"],
): boolean =>
  session_state === "won" ||
  session_state === "lost" ||
  session_state === "recoverable_error";

const runWithMidRestore = (input: {
  encounter: HeadlessEncounterDefinition;
  casts: readonly CastSubmission[];
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

  const resumed = isTerminalSessionState(restored.session_state)
    ? {
        terminal: preRestore.terminal,
        terminal_snapshot: structuredClone(preRestore.terminal_snapshot),
        transcript: [] as HeadlessTranscriptEntry[],
        deterministic_serialized: {
          terminal_snapshot:
            preRestore.deterministic_serialized.terminal_snapshot,
          transcript: "[]",
        },
      }
    : runEncounterHeadless({
        encounter: buildResumeEncounter(input.encounter, restored),
        cast_submissions: input.casts.slice(input.restore_after_casts),
      });

  assert.deepEqual(
    preRestore.terminal_snapshot,
    preRestoreSnapshotBeforeResume,
  );

  return {
    uninterrupted,
    preRestore,
    resumed,
    restored_transcript: [
      ...preRestore.transcript.map((entry) => structuredClone(entry)),
      ...resumed.transcript.map((entry) => structuredClone(entry)),
    ],
  };
};

const findWordPath = (
  board: HeadlessEncounterDefinition["board"],
  normalizedWord: string,
): BoardPosition[] | null => {
  const word = normalizedWord.toUpperCase();
  const grid = Array.from({ length: board.height }, () =>
    Array.from(
      { length: board.width },
      () =>
        null as HeadlessEncounterDefinition["board"]["tiles"][number] | null,
    ),
  );

  for (const tile of board.tiles) {
    if (
      tile.position.row >= 0 &&
      tile.position.row < board.height &&
      tile.position.col >= 0 &&
      tile.position.col < board.width
    ) {
      grid[tile.position.row][tile.position.col] = tile;
    }
  }

  const visited = Array.from({ length: board.height }, () =>
    Array(board.width).fill(false),
  );
  const directions = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ] as const;

  const search = (
    row: number,
    col: number,
    index: number,
    path: BoardPosition[],
  ): BoardPosition[] | null => {
    const tile = grid[row]?.[col];
    if (!tile || visited[row][col] || tile.state === "frozen") {
      return null;
    }

    if (tile.letter !== word[index]) {
      return null;
    }

    const nextPath = [...path, { row, col }];
    if (index === word.length - 1) {
      return nextPath;
    }

    visited[row][col] = true;

    for (const [rowOffset, colOffset] of directions) {
      const candidate = search(
        row + rowOffset,
        col + colOffset,
        index + 1,
        nextPath,
      );
      if (candidate) {
        visited[row][col] = false;
        return candidate;
      }
    }

    visited[row][col] = false;
    return null;
  };

  for (let row = 0; row < board.height; row += 1) {
    for (let col = 0; col < board.width; col += 1) {
      const candidate = search(row, col, 0, []);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
};

test("integration: authored starter script preserves guided leaf cast and immediate post-spell sun teaching word", () => {
  const starterScript = STARTER_PAYLOAD.encounter.starterTutorialScript;
  assert.notEqual(starterScript, null);

  const starterEncounter = buildHeadlessEncounter({
    payload: STARTER_PAYLOAD,
    board_rows: STARTER_BOARD_ROWS,
    encounter_seed: STARTER_SEED,
    countdown_current: 1,
  });

  const guidedCast = createCastFromWordPath(
    starterScript?.guidedFirstCast.normalizedWord ?? "leaf",
    starterScript?.guidedFirstCast.selectedPositions ?? [],
  );
  const result = runEncounterHeadless({
    encounter: starterEncounter,
    cast_submissions: [guidedCast],
  });

  const guidedEntry = result.transcript[0];
  const guidedResolution = guidedEntry?.cast_resolution;
  const sunTarget =
    starterScript?.starterBoardOpening.postFirstSpellWeaknessTeachingTarget;
  const sunPath = findWordPath(
    result.terminal_snapshot.board,
    sunTarget?.normalizedWord ?? "sun",
  );
  const bubbleTiles = result.terminal_snapshot.board.tiles.filter(
    (tile) => tile.state === "bubble",
  );

  assert.notEqual(guidedEntry, undefined);
  assert.deepEqual(
    guidedEntry?.submission.selected_positions,
    starterScript?.guidedFirstCast.selectedPositions,
  );
  assert.equal(guidedResolution?.submission_kind, "valid");
  if (!guidedResolution || guidedResolution.submission_kind !== "valid") {
    throw new Error("Expected guided starter cast to resolve as valid.");
  }
  assert.equal(guidedResolution.normalized_word, "leaf");
  assert.equal(guidedResolution.element, "bloom");
  assert.equal(
    resolveElementForWord(
      sunTarget?.normalizedWord ?? "sun",
      AUTHORED_VALIDATION_LOOKUP,
    ),
    sunTarget?.expectedElement,
  );
  assert.equal(
    result.terminal_snapshot.creature.spell_countdown_current,
    STARTER_PAYLOAD.creature.baseCountdown,
  );
  assert.equal(bubbleTiles.length, 1);
  assert.equal(sunPath !== null, true);
  assert.equal(result.terminal_snapshot.session_state, "in_progress");
});

test("integration: authored starter slice keeps fresh-run and save/restore transcript parity", () => {
  const starterScript = STARTER_PAYLOAD.encounter.starterTutorialScript;
  assert.notEqual(starterScript, null);

  const starterEncounter = buildHeadlessEncounter({
    payload: STARTER_PAYLOAD,
    board_rows: STARTER_BOARD_ROWS,
    encounter_seed: STARTER_SEED,
    countdown_current: 1,
  });

  const guidedCast = createCastFromWordPath(
    starterScript?.guidedFirstCast.normalizedWord ?? "leaf",
    starterScript?.guidedFirstCast.selectedPositions ?? [],
  );
  const postLeaf = runEncounterHeadless({
    encounter: starterEncounter,
    cast_submissions: [guidedCast],
  });
  const sunWord =
    starterScript?.starterBoardOpening.postFirstSpellWeaknessTeachingTarget
      .normalizedWord ?? "sun";
  const sunPath = findWordPath(postLeaf.terminal_snapshot.board, sunWord);

  assert.notEqual(sunPath, null);

  const casts = [
    guidedCast,
    createCastFromWordPath(sunWord, sunPath ?? []),
  ] as const;
  const { uninterrupted, resumed, restored_transcript } = runWithMidRestore({
    encounter: starterEncounter,
    casts,
    restore_after_casts: 1,
  });
  const repeated = runEncounterHeadless({
    encounter: starterEncounter,
    cast_submissions: casts,
  });

  assertTranscriptPhaseInvariants(uninterrupted.transcript);
  assert.deepEqual(restored_transcript, uninterrupted.transcript);
  assert.deepEqual(resumed.terminal_snapshot, uninterrupted.terminal_snapshot);
  assert.deepEqual(repeated.terminal_snapshot, uninterrupted.terminal_snapshot);
  assert.equal(
    repeated.deterministic_serialized.transcript,
    uninterrupted.deterministic_serialized.transcript,
  );
  assert.equal(
    repeated.deterministic_serialized.terminal_snapshot,
    uninterrupted.deterministic_serialized.terminal_snapshot,
  );
  assert.equal(
    hashRun(
      uninterrupted.deterministic_serialized.terminal_snapshot,
      uninterrupted.deterministic_serialized.transcript,
    ),
    hashRun(
      repeated.deterministic_serialized.terminal_snapshot,
      repeated.deterministic_serialized.transcript,
    ),
  );
});

test("integration: authored Cinder Cub payload resets countdown and applies soot spell from canonical spellPrimitives", () => {
  const meadowEncounter = buildHeadlessEncounter({
    payload: MEADOW_PAYLOAD,
    board_rows: MEADOW_BOARD_ROWS,
    encounter_seed: MEADOW_SEED,
    countdown_current: 1,
  });
  const leafPath = findWordPath(meadowEncounter.board, "leaf");

  assert.notEqual(leafPath, null);

  const result = runEncounterHeadless({
    encounter: meadowEncounter,
    cast_submissions: [createCastFromWordPath("leaf", leafPath ?? [])],
  });

  const entry = result.transcript[0];
  const castResolution = entry?.cast_resolution;
  const sootedTiles = result.terminal_snapshot.board.tiles.filter(
    (tile) => tile.state === "sooted",
  );

  assert.notEqual(entry, undefined);
  assert.equal(castResolution?.submission_kind, "valid");
  if (!castResolution || castResolution.submission_kind !== "valid") {
    throw new Error("Expected Meadow cast to resolve as valid.");
  }
  assert.equal(castResolution.matchup_result, "neutral");
  assert.equal(
    result.terminal_snapshot.creature.spell_countdown_current,
    MEADOW_PAYLOAD.creature.baseCountdown,
  );
  assert.equal(sootedTiles.length, 2);
  assert.equal(
    sootedTiles.every((tile) => tile.state_turns_remaining === 2),
    true,
  );
  assert.equal(result.terminal_snapshot.session_state, "in_progress");
});

test("integration: authored Meadow 001 slice keeps deterministic save/restore parity and terminal outcome", () => {
  const meadowEncounter = buildHeadlessEncounter({
    payload: MEADOW_PAYLOAD,
    board_rows: MEADOW_BOARD_ROWS,
    encounter_seed: MEADOW_SEED,
    hp_current: 8,
  });
  const leafPath = findWordPath(meadowEncounter.board, "leaf");
  const pathPath = findWordPath(meadowEncounter.board, "path");

  assert.notEqual(leafPath, null);
  assert.notEqual(pathPath, null);

  const casts = [
    createCastFromWordPath("leaf", leafPath ?? []),
    createCastFromWordPath("path", pathPath ?? []),
  ] as const;
  const { uninterrupted, resumed, restored_transcript } = runWithMidRestore({
    encounter: meadowEncounter,
    casts,
    restore_after_casts: 1,
  });
  const repeated = runEncounterHeadless({
    encounter: meadowEncounter,
    cast_submissions: casts,
  });

  assertTranscriptPhaseInvariants(uninterrupted.transcript);
  assert.deepEqual(uninterrupted.terminal, {
    outcome: "won",
    terminal_reason: "normal_win",
  });
  assert.deepEqual(restored_transcript, uninterrupted.transcript);
  assert.deepEqual(resumed.terminal_snapshot, uninterrupted.terminal_snapshot);
  assert.deepEqual(repeated.terminal_snapshot, uninterrupted.terminal_snapshot);
  assert.equal(
    repeated.deterministic_serialized.transcript,
    uninterrupted.deterministic_serialized.transcript,
  );
  assert.equal(
    repeated.deterministic_serialized.terminal_snapshot,
    uninterrupted.deterministic_serialized.terminal_snapshot,
  );
  assert.equal(
    hashRun(
      uninterrupted.deterministic_serialized.terminal_snapshot,
      uninterrupted.deterministic_serialized.transcript,
    ),
    hashRun(
      repeated.deterministic_serialized.terminal_snapshot,
      repeated.deterministic_serialized.transcript,
    ),
  );
});

const stableHashHex = (input: string): string => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};
