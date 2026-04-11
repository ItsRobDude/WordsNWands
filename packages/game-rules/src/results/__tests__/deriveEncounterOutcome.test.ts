import test from "node:test";
import assert from "node:assert/strict";

import type {
  BoardSnapshot,
  EncounterRuntimeState,
} from "../../contracts/board.js";
import { runSparkShuffle } from "../../recovery/runSparkShuffle.ts";
import { deriveEncounterOutcome } from "../deriveEncounterOutcome.ts";

const createBoard = (): BoardSnapshot => ({
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
});

const createEncounterState = (
  overrides: Partial<EncounterRuntimeState> = {},
): EncounterRuntimeState => ({
  encounter_session_id: "s1",
  encounter_id: "e1",
  encounter_seed: "seed",
  board: createBoard(),
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
  ...overrides,
});

test("victory interrupts countdown decrement and creature spell", () => {
  let spell_calls = 0;
  const encounter_state = createEncounterState({
    creature: {
      ...createEncounterState().creature,
      hp_current: 1,
      spell_countdown_current: 1,
    },
  });

  const result = deriveEncounterOutcome({
    encounter_state,
    cast: {
      word_length: 3,
      cast_element: "flame",
      used_wand_tile: false,
      selected_tile_states: [],
    },
    board_after_resolution: encounter_state.board,
    apply_creature_spell: (input) => {
      spell_calls += 1;
      return { board: input.board, creature: input.creature };
    },
  });

  assert.equal(result.did_win, true);
  assert.equal(result.did_trigger_creature_spell, false);
  assert.equal(spell_calls, 0);
  assert.equal(result.encounter_state.creature.spell_countdown_current, 1);
});

test("weakness hit stalls countdown and does not decrement", () => {
  const encounter_state = createEncounterState();

  const result = deriveEncounterOutcome({
    encounter_state,
    cast: {
      word_length: 3,
      cast_element: "flame",
      used_wand_tile: false,
      selected_tile_states: [],
    },
    board_after_resolution: encounter_state.board,
  });

  assert.equal(result.matchup_result, "weakness");
  assert.equal(result.encounter_state.creature.spell_countdown_current, 2);
});

test("final-move countdown-zero ordering resolves spell before terminal loss", () => {
  const order: string[] = [];

  const encounter_state = createEncounterState({
    moves_remaining: 1,
    creature: {
      ...createEncounterState().creature,
      spell_countdown_current: 1,
      weakness_element: "tide",
    },
  });

  const result = deriveEncounterOutcome({
    encounter_state,
    cast: {
      word_length: 3,
      cast_element: "flame",
      used_wand_tile: false,
      selected_tile_states: [],
    },
    board_after_resolution: encounter_state.board,
    apply_creature_spell: (input) => {
      order.push("spell");
      return {
        board: {
          ...input.board,
          tiles: input.board.tiles.map((tile) =>
            tile.id === "a" ? { ...tile, state: "frozen" } : tile,
          ),
        },
        creature: input.creature,
      };
    },
  });

  if (result.did_lose) {
    order.push("loss");
  }

  assert.deepEqual(order, ["spell", "loss"]);
  assert.equal(result.encounter_state.session_state, "lost");
  assert.equal(
    result.encounter_state.board.tiles.find((tile) => tile.id === "a")?.state,
    "frozen",
  );
});

test("dead-board spark-shuffle retries are deterministic for fixed random stream", () => {
  const encounter_state = createEncounterState();
  const random_values = [0, 1, 0, 1, 0, 1];
  let index = 0;

  const runOnce = () =>
    runSparkShuffle({
      encounter_state,
      has_playable_word: (board) =>
        board.tiles[0]?.id === "a" && board.tiles[1]?.id === "b",
      next_random_index: () => {
        const value = random_values[index % random_values.length];
        index += 1;
        return value;
      },
      max_shuffle_retries_per_recovery_cycle: 3,
    });

  index = 0;
  const first = runOnce();
  index = 0;
  const second = runOnce();

  assert.deepEqual(first.metadata, second.metadata);
  assert.deepEqual(
    first.encounter_state.board.tiles,
    second.encounter_state.board.tiles,
  );
});

test("deriveEncounterOutcome does not mutate input encounter state", () => {
  const encounter_state = createEncounterState();
  const original = structuredClone(encounter_state);

  const result = deriveEncounterOutcome({
    encounter_state,
    cast: {
      word_length: 3,
      cast_element: "storm",
      used_wand_tile: false,
      selected_tile_states: [],
    },
    board_after_resolution: encounter_state.board,
    is_dead_board: () => false,
  });

  assert.deepEqual(encounter_state, original);
  assert.notEqual(result.encounter_state, encounter_state);
});
