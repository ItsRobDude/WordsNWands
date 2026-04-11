import test from "node:test";
import assert from "node:assert/strict";

import type { EncounterRuntimeState } from "../../contracts/board.js";
import { applyCreatureSpell } from "../applyCreatureSpell.ts";

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
      {
        id: "d",
        letter: "D",
        position: { row: 1, col: 1 },
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
    creature_id: "c1",
    display_name: "Imp",
    encounter_type: "standard",
    difficulty_tier: "standard",
    weakness_element: "flame",
    resistance_element: "tide",
    hp_current: 40,
    hp_max: 40,
    spell_countdown_current: 2,
    spell_countdown_reset: 2,
  },
  session_state: "in_progress",
  terminal_reason_code: null,
  moves_remaining: 3,
  move_budget_total: 3,
  repeated_words: [],
  casts_resolved_count: 0,
  spark_shuffle_retry_count: 0,
  updated_at_utc: "2026-04-11T00:00:00.000Z",
});

test("applyCreatureSpell returns a new encounter object without mutating input", () => {
  const encounter_state = createEncounterState();
  const original = structuredClone(encounter_state);

  const result = applyCreatureSpell({
    encounter_state,
    primitive: {
      kind: "chained",
      steps: [
        {
          kind: "shift_row",
          row_index: 0,
          mode: "rotate",
          distance: 1,
          direction: 1,
        },
        {
          kind: "apply_tile_state",
          tile_state: "frozen",
          target_count: 1,
          targeting: "random_eligible",
        },
      ],
    },
  });

  assert.deepEqual(encounter_state, original);
  assert.notEqual(result, encounter_state);
  const top_row = result.board.tiles
    .filter((tile) => tile.position.row === 0)
    .sort((left, right) => left.position.col - right.position.col);
  const frozen_tiles = result.board.tiles.filter(
    (tile) => tile.state === "frozen",
  );

  assert.deepEqual(
    top_row.map((tile) => tile.id),
    ["b", "a"],
  );
  assert.equal(frozen_tiles.length, 1);
  assert.equal(frozen_tiles[0]?.state_turns_remaining, 2);
});
