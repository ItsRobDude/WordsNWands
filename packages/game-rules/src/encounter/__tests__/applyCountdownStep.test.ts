import assert from "node:assert/strict";
import test from "node:test";

import type { EncounterRuntimeState } from "../../contracts/board.js";
import { applyCountdownStep } from "../applyCountdownStep.ts";

const createEncounterState = (): EncounterRuntimeState => ({
  encounter_session_id: "s1",
  encounter_id: "e1",
  encounter_seed: "seed",
  board: {
    width: 1,
    height: 1,
    tiles: [
      {
        id: "a",
        letter: "A",
        position: { row: 0, col: 0 },
        state: null,
        special_marker: null,
      },
    ],
    rng_stream_states: {
      board_fill_stream_state: "bf",
      creature_spell_stream_state: "cf",
      spark_shuffle_stream_state: "sf",
    },
  },
  creature: {
    creature_id: "c1",
    display_name: "Wisp",
    encounter_type: "standard",
    difficulty_tier: "standard",
    weakness_element: "flame",
    resistance_element: "tide",
    hp_current: 10,
    hp_max: 10,
    spell_countdown_current: 1,
    spell_countdown_reset: 4,
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

test("applyCountdownStep uses weakness stall and preserves countdown", () => {
  const encounter_state = createEncounterState();
  encounter_state.creature.spell_countdown_current = 2;

  const result = applyCountdownStep({
    encounter_state,
    matchup_result: "weakness",
  });

  assert.equal(result.countdown_before, 2);
  assert.equal(result.countdown_after, 2);
  assert.equal(result.countdown_decremented, 0);
  assert.equal(result.did_trigger_creature_spell, false);
  assert.equal(result.encounter_state, encounter_state);
});

test("applyCountdownStep deterministic and non-mutating for identical input", () => {
  const encounter_state = createEncounterState();
  const original = structuredClone(encounter_state);

  const first = applyCountdownStep({
    encounter_state,
    matchup_result: "neutral",
  });
  const second = applyCountdownStep({
    encounter_state,
    matchup_result: "neutral",
  });

  assert.deepEqual(encounter_state, original);
  assert.deepEqual(first, second);
  assert.equal(first.did_trigger_creature_spell, true);
  assert.equal(first.encounter_state.creature.spell_countdown_current, 4);
});
