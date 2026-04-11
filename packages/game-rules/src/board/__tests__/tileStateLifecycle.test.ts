import assert from "node:assert/strict";
import test from "node:test";

import type { BoardSnapshot } from "../../contracts/board.js";
import { applyBubbleRise } from "../applyBubbleRise.ts";
import { tickSurvivingTileStates } from "../tickSurvivingTileStates.ts";

const createBoard = (tiles: BoardSnapshot["tiles"]): BoardSnapshot => ({
  width: 1,
  height: tiles.length,
  tiles,
  rng_stream_states: {
    board_fill_stream_state: "bf",
    creature_spell_stream_state: "cs",
    spark_shuffle_stream_state: "ss",
  },
});

test("applyBubbleRise lifts surviving bubble tiles to the top of the column and clears them", () => {
  const board = createBoard([
    {
      id: "h",
      letter: "H",
      position: { row: 0, col: 0 },
      state: null,
      state_turns_remaining: null,
      special_marker: null,
    },
    {
      id: "b1",
      letter: "B",
      position: { row: 1, col: 0 },
      state: "bubble",
      state_turns_remaining: 1,
      special_marker: null,
    },
    {
      id: "m",
      letter: "M",
      position: { row: 2, col: 0 },
      state: null,
      state_turns_remaining: null,
      special_marker: null,
    },
    {
      id: "b2",
      letter: "N",
      position: { row: 3, col: 0 },
      state: "bubble",
      state_turns_remaining: 1,
      special_marker: null,
    },
  ]);

  const risen = applyBubbleRise({ board });
  const ordered = [...risen.tiles].sort(
    (left, right) => left.position.row - right.position.row,
  );

  assert.deepEqual(
    ordered.map((tile) => ({
      id: tile.id,
      row: tile.position.row,
      state: tile.state,
    })),
    [
      { id: "b1", row: 0, state: null },
      { id: "b2", row: 1, state: null },
      { id: "h", row: 2, state: null },
      { id: "m", row: 3, state: null },
    ],
  );
});

test("tickSurvivingTileStates decrements surviving frozen, sooted, and dull durations", () => {
  const board = createBoard([
    {
      id: "f",
      letter: "F",
      position: { row: 0, col: 0 },
      state: "frozen",
      state_turns_remaining: 1,
      special_marker: null,
    },
    {
      id: "s",
      letter: "S",
      position: { row: 1, col: 0 },
      state: "sooted",
      state_turns_remaining: 2,
      special_marker: null,
    },
    {
      id: "d",
      letter: "D",
      position: { row: 2, col: 0 },
      state: "dull",
      state_turns_remaining: 1,
      special_marker: null,
    },
  ]);

  const ticked = tickSurvivingTileStates({ board });
  const by_id = Object.fromEntries(ticked.tiles.map((tile) => [tile.id, tile]));

  assert.equal(by_id.f.state, null);
  assert.equal(by_id.f.state_turns_remaining, null);
  assert.equal(by_id.s.state, "sooted");
  assert.equal(by_id.s.state_turns_remaining, 1);
  assert.equal(by_id.d.state, null);
  assert.equal(by_id.d.state_turns_remaining, null);
});
