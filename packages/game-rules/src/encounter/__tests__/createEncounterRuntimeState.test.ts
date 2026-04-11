import assert from "node:assert/strict";
import test from "node:test";

import type {
  BoardSnapshot,
  CreatureRuntimeState,
} from "../../contracts/board.js";
import { createEncounterRuntimeState } from "../createEncounterRuntimeState.ts";

const createBoardInput = (): Omit<BoardSnapshot, "rng_stream_states"> => ({
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
  ],
});

const createCreature = (): CreatureRuntimeState => ({
  creature_id: "cr-1",
  display_name: "Wisp",
  encounter_type: "standard",
  difficulty_tier: "gentle",
  weakness_element: "flame",
  resistance_element: "tide",
  hp_current: 10,
  hp_max: 10,
  spell_countdown_current: 3,
  spell_countdown_reset: 3,
});

test("createEncounterRuntimeState seeds deterministic stream states and defaults", () => {
  const result = createEncounterRuntimeState({
    encounter_session_id: "s1",
    encounter_id: "e1",
    encounter_seed: "seed-a",
    board: createBoardInput(),
    creature: createCreature(),
    move_budget_total: 12,
    updated_at_utc: "2026-04-11T00:00:00.000Z",
  });

  assert.equal(result.session_state, "unopened");
  assert.equal(result.moves_remaining, 12);
  assert.equal(result.terminal_reason_code, null);
  assert.deepEqual(result.repeated_words, []);
  assert.equal(result.spark_shuffle_retry_cap, 3);
  assert.equal(result.spark_shuffle_retries_attempted, 0);
  assert.equal(result.spark_shuffle_fallback_outcome, "none");
  assert.equal(result.content_version_pin, "content_version_unpinned");
  assert.equal(
    result.validation_snapshot_version_pin,
    "validation_snapshot_unpinned",
  );
  assert.equal(result.battle_rules_version_pin, "battle_rules_unpinned");
  assert.equal(
    result.board_generator_version_pin,
    "board_generator_unpinned",
  );
  assert.equal(
    result.reward_constants_version_pin,
    "reward_constants_unpinned",
  );
  assert.equal(result.damage_model_version, "damage_model_v1");
  assert.equal(
    result.board.rng_stream_states.board_fill_stream_state,
    "seed-a::e1::board_fill::v1::0",
  );
});

test("createEncounterRuntimeState is deterministic and does not mutate input", () => {
  const input = {
    encounter_session_id: "s1",
    encounter_id: "e1",
    encounter_seed: "seed-a",
    board: createBoardInput(),
    creature: createCreature(),
    move_budget_total: 10,
    updated_at_utc: "2026-04-11T00:00:00.000Z",
    repeated_words: ["stone"],
  } as const;
  const original = structuredClone(input);

  const first = createEncounterRuntimeState(input);
  const second = createEncounterRuntimeState(input);

  assert.deepEqual(input, original);
  assert.deepEqual(first, second);
  assert.notEqual(first.board.tiles, input.board.tiles);
});
