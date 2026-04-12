import assert from "node:assert/strict";
import test from "node:test";

import type { BoardSnapshot } from "../../contracts/board.js";
import type { CastSubmission } from "../../contracts/cast.js";
import { collapseColumns } from "../collapseColumns.ts";
import { consumeTiles } from "../consumeTiles.ts";
import { createInitialBoard } from "../createInitialBoard.ts";
import { refillBoard } from "../refillBoard.ts";
import { selectBestBoardCandidate } from "../selectBestBoardCandidate.ts";

const createEmptyBoard = (): Omit<BoardSnapshot, "tiles"> => ({
  width: 3,
  height: 2,
  rng_stream_states: {
    board_fill_stream_state: "seed::board_fill::v1::0",
    creature_spell_stream_state: "seed::creature_spell::v1::0",
    spark_shuffle_stream_state: "seed::spark_shuffle::v1::0",
  },
});

test("createInitialBoard fills full board and advances stream deterministically", () => {
  const first = createInitialBoard({
    board: createEmptyBoard(),
    letter_pool: ["A", "B", "C"],
  });
  const second = createInitialBoard({
    board: createEmptyBoard(),
    letter_pool: ["A", "B", "C"],
  });

  assert.equal(first.board.tiles.length, 6);
  assert.deepEqual(first, second);
  assert.equal(
    first.board.rng_stream_states.board_fill_stream_state,
    "seed::board_fill::v1::6",
  );

  const positions = new Set(
    first.board.tiles.map(
      (tile) => `${tile.position.row}:${tile.position.col}`,
    ),
  );
  assert.equal(positions.size, 6);
});

test("consumeTiles removes selected positions only", () => {
  const board: BoardSnapshot = {
    ...createEmptyBoard(),
    tiles: [
      {
        id: "t00",
        letter: "A",
        position: { row: 0, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "t01",
        letter: "B",
        position: { row: 0, col: 1 },
        state: null,
        special_marker: null,
      },
      {
        id: "t10",
        letter: "C",
        position: { row: 1, col: 0 },
        state: null,
        special_marker: null,
      },
    ],
  };

  const submission: CastSubmission = {
    traced_word_display: "ab",
    selected_positions: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
    ],
  };

  const consumed = consumeTiles({ board, submission });

  assert.deepEqual(
    consumed.tiles.map((tile) => tile.id),
    ["t01"],
  );
});

test("collapseColumns drops surviving tiles vertically without sideways movement", () => {
  const board: BoardSnapshot = {
    ...createEmptyBoard(),
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
        position: { row: 1, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "c",
        letter: "C",
        position: { row: 0, col: 2 },
        state: null,
        special_marker: null,
      },
    ],
  };

  const collapsed = collapseColumns({ board });

  const by_id = Object.fromEntries(
    collapsed.tiles.map((tile) => [tile.id, tile]),
  );
  assert.deepEqual(by_id.a.position, { row: 0, col: 0 });
  assert.deepEqual(by_id.b.position, { row: 1, col: 0 });
  assert.deepEqual(by_id.c.position, { row: 1, col: 2 });
});

test("refillBoard fills gaps and advances board stream by spawned tile count", () => {
  const board: BoardSnapshot = {
    ...createEmptyBoard(),
    tiles: [
      {
        id: "occupied",
        letter: "Z",
        position: { row: 1, col: 1 },
        state: null,
        special_marker: null,
      },
    ],
  };

  const result = refillBoard({
    board,
    rng_stream_states: board.rng_stream_states,
    letter_pool: ["Q"],
  });

  assert.equal(result.board.tiles.length, 6);
  assert.equal(
    result.rng_stream_states.board_fill_stream_state,
    "seed::board_fill::v1::5",
  );
  assert.equal(
    result.board.tiles.every((tile) =>
      tile.id === "occupied" ? tile.letter === "Z" : tile.letter === "Q",
    ),
    true,
  );
});

test("selectBestBoardCandidate keeps the strongest accepted board while preserving final rng lineage", () => {
  const validation_lookup = createSingleLetterLookup(["A", "B", "C", "D"]);
  const weakCandidate = createCandidateBoard({
    rng_stream_state: "seed::board_fill::v1::4",
    rows: ["AA", "BB"],
  });
  const strongCandidate = createCandidateBoard({
    rng_stream_state: "seed::board_fill::v1::8",
    rows: ["AB", "CD"],
  });
  const deadCandidate = createCandidateBoard({
    rng_stream_state: "seed::board_fill::v1::12",
    rows: ["ZZ", "ZZ"],
  });
  const queued_candidates = [strongCandidate, deadCandidate];

  const selected = selectBestBoardCandidate({
    initial_candidate: weakCandidate,
    candidate_search_attempts: 3,
    policy: {
      minimum_playable_word_count: 3,
      target_playable_word_count: 4,
      playable_word_count_search_limit: 4,
      minimum_length: 1,
      repeated_words: [],
      validation_lookup,
    },
    next_candidate: () => {
      const next = queued_candidates.shift();
      assert.notEqual(next, undefined);
      if (!next) {
        throw new Error("Expected queued board candidate.");
      }
      return next;
    },
  });

  assert.deepEqual(
    selected.board.tiles.map((tile) => tile.letter).join(""),
    "ABCD",
  );
  assert.equal(
    selected.rng_stream_states.board_fill_stream_state,
    "seed::board_fill::v1::12",
  );
  assert.equal(
    selected.board.rng_stream_states.board_fill_stream_state,
    "seed::board_fill::v1::12",
  );
});

const createCandidateBoard = (input: {
  rng_stream_state: string;
  rows: readonly string[];
}) => {
  const height = input.rows.length;
  const width = input.rows[0]?.length ?? 0;

  return {
    board: {
      width,
      height,
      tiles: input.rows.flatMap((row, rowIndex) =>
        [...row].map((letter, colIndex) => ({
          id: `${input.rng_stream_state}-${rowIndex}-${colIndex}`,
          letter,
          position: { row: rowIndex, col: colIndex },
          state: null,
          state_turns_remaining: null,
          special_marker: null,
        })),
      ),
      rng_stream_states: {
        board_fill_stream_state: input.rng_stream_state,
        creature_spell_stream_state: "seed::creature_spell::v1::0",
        spark_shuffle_stream_state: "seed::spark_shuffle::v1::0",
      },
    },
    rng_stream_states: {
      board_fill_stream_state: input.rng_stream_state,
      creature_spell_stream_state: "seed::creature_spell::v1::0",
      spark_shuffle_stream_state: "seed::spark_shuffle::v1::0",
    },
  };
};

const createSingleLetterLookup = (letters: readonly string[]) => {
  const normalized_letters = new Set(
    letters.map((letter) => letter.toLowerCase()),
  );

  return {
    snapshot_version: "single-letter-test",
    metadata: {
      snapshot_version: "single-letter-test",
      language: "en" as const,
      word_count: normalized_letters.size,
      tagged_word_count: normalized_letters.size,
      generated_at_utc: "2026-04-11T00:00:00.000Z",
    },
    hasWord: (normalized_word: string) =>
      normalized_letters.has(normalized_word),
    hasPrefix: (normalized_prefix: string) =>
      normalized_letters.has(normalized_prefix),
    getEntry: (normalized_word: string) =>
      normalized_letters.has(normalized_word)
        ? { normalized_word, element: "arcane" as const }
        : null,
    getMaxWordLength: () => 1,
  };
};
