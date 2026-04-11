import type {
  ElementType,
  MatchupResult,
  TileStateKind,
} from "../contracts/core.js";

export const DAMAGE_MODEL_V1_VERSION = "damage_model_v1" as const;

export const DAMAGE_MODEL_V1_FINGERPRINT =
  "DMV1|base=8+3*(L-3)+max(0,L-5)|matchup=1.5,1.0,0.7,1.0|wand=1.25|soot=0.75|round=half_up|min=1" as const;

export const DAMAGE_MODEL_V1_CONSTANTS = {
  base_damage_offset: 8,
  base_damage_per_letter_over_three: 3,
  base_damage_extra_per_letter_over_five: 1,
  matchup_multiplier: {
    weakness: 1.5,
    neutral: 1,
    resistance: 0.7,
    arcane: 1,
  },
  wand_multiplier: 1.25,
  soot_multiplier: 0.75,
  minimum_final_damage: 1,
} as const;

export interface DamageModelV1Input {
  word_length: number;
  matchup_result: MatchupResult;
  cast_element: ElementType;
  used_wand_tile: boolean;
  selected_tile_states?: readonly (TileStateKind | null)[];
}

export interface DamageModelV1Result {
  base_damage: number;
  raw_damage: number;
  final_damage: number;
  matchup_multiplier: number;
  wand_multiplier: number;
  soot_multiplier: number;
}

export const getBaseDamage = (wordLength: number): number => {
  const length = Math.max(0, Math.floor(wordLength));

  return (
    DAMAGE_MODEL_V1_CONSTANTS.base_damage_offset +
    DAMAGE_MODEL_V1_CONSTANTS.base_damage_per_letter_over_three * (length - 3) +
    Math.max(0, length - 5) *
      DAMAGE_MODEL_V1_CONSTANTS.base_damage_extra_per_letter_over_five
  );
};

export const roundFinalDamage = (rawDamage: number): number => {
  if (!Number.isFinite(rawDamage) || Number.isNaN(rawDamage)) {
    return DAMAGE_MODEL_V1_CONSTANTS.minimum_final_damage;
  }

  return Math.max(
    DAMAGE_MODEL_V1_CONSTANTS.minimum_final_damage,
    Math.round(Math.max(0, rawDamage)),
  );
};

export const resolveMatchupResult = (input: {
  cast_element: ElementType;
  weakness_element: ElementType;
  resistance_element: ElementType;
  selected_tile_states?: readonly (TileStateKind | null)[];
}): MatchupResult => {
  const has_dull_tile =
    input.cast_element !== "arcane" &&
    (input.selected_tile_states ?? []).some((state) => state === "dull");

  if (has_dull_tile) {
    return "neutral";
  }

  if (input.cast_element === input.weakness_element) {
    return "weakness";
  }

  if (input.cast_element === input.resistance_element) {
    return "resistance";
  }

  return "neutral";
};

export const damageModelV1 = (
  input: DamageModelV1Input,
): DamageModelV1Result => {
  const base_damage = getBaseDamage(input.word_length);
  const matchup_multiplier =
    input.cast_element === "arcane"
      ? DAMAGE_MODEL_V1_CONSTANTS.matchup_multiplier.arcane
      : DAMAGE_MODEL_V1_CONSTANTS.matchup_multiplier[input.matchup_result];
  const wand_multiplier = input.used_wand_tile
    ? DAMAGE_MODEL_V1_CONSTANTS.wand_multiplier
    : 1;
  const has_sooted_tile = (input.selected_tile_states ?? []).some(
    (state) => state === "sooted",
  );
  const soot_multiplier = has_sooted_tile
    ? DAMAGE_MODEL_V1_CONSTANTS.soot_multiplier
    : 1;

  const raw_damage =
    base_damage * matchup_multiplier * wand_multiplier * soot_multiplier;

  return {
    base_damage,
    raw_damage,
    final_damage: roundFinalDamage(raw_damage),
    matchup_multiplier,
    wand_multiplier,
    soot_multiplier,
  };
};
