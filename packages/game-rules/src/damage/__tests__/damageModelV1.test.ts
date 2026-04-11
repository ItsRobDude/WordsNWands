import test from "node:test";
import assert from "node:assert/strict";

import { damageModelV1, resolveMatchupResult } from "../damageModelV1.ts";

test("damage model applies weakness, neutral, and resistance multipliers", () => {
  const weakness = damageModelV1({
    word_length: 5,
    matchup_result: "weakness",
    cast_element: "flame",
    used_wand_tile: false,
  });
  const neutral = damageModelV1({
    word_length: 5,
    matchup_result: "neutral",
    cast_element: "flame",
    used_wand_tile: false,
  });
  const resistance = damageModelV1({
    word_length: 5,
    matchup_result: "resistance",
    cast_element: "flame",
    used_wand_tile: false,
  });

  assert.equal(weakness.final_damage, 21);
  assert.equal(neutral.final_damage, 14);
  assert.equal(resistance.final_damage, 10);
});

test("Dull override forces neutral matchup for non-arcane casts", () => {
  const result = resolveMatchupResult({
    cast_element: "flame",
    weakness_element: "flame",
    resistance_element: "tide",
    selected_tile_states: ["dull"],
  });

  assert.equal(result, "neutral");
});

test("countdown weakness stall uses post-Dull matchup result", () => {
  const weaknessMatchup = resolveMatchupResult({
    cast_element: "flame",
    weakness_element: "flame",
    resistance_element: "tide",
    selected_tile_states: [],
  });

  const dullOverriddenMatchup = resolveMatchupResult({
    cast_element: "flame",
    weakness_element: "flame",
    resistance_element: "tide",
    selected_tile_states: ["dull"],
  });

  assert.equal(weaknessMatchup, "weakness");
  assert.equal(dullOverriddenMatchup, "neutral");
});
