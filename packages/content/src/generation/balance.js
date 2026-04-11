const TIER_DEFAULTS = {
  gentle: { avg_word_length: 4.0, weakness_hit_rate: 0.28, wand_incidence: 0.18, soot_exposure: 0.12, target_casts_to_defeat: 6 },
  standard: { avg_word_length: 4.3, weakness_hit_rate: 0.34, wand_incidence: 0.2, soot_exposure: 0.15, target_casts_to_defeat: 7 },
  challenging: { avg_word_length: 4.6, weakness_hit_rate: 0.38, wand_incidence: 0.22, soot_exposure: 0.19, target_casts_to_defeat: 8 },
  boss: { avg_word_length: 4.8, weakness_hit_rate: 0.42, wand_incidence: 0.24, soot_exposure: 0.22, target_casts_to_defeat: 9.5 },
  event: { avg_word_length: 4.6, weakness_hit_rate: 0.36, wand_incidence: 0.22, soot_exposure: 0.2, target_casts_to_defeat: 8 }
};

const FAIL_BAND_DEFAULTS = {
  low: { efficiency_slack: 0.55, target_spell_count_on_win: 1.5 },
  medium: { efficiency_slack: 0.35, target_spell_count_on_win: 2.5 },
  high: { efficiency_slack: 0.2, target_spell_count_on_win: 3.5 }
};

const COUNTDOWN_GUARDRAILS = {
  gentle: [4, 6],
  standard: [3, 6],
  challenging: [3, 5],
  boss: [2, 5],
  event: [2, 5]
};

export function resolveTierProfile(targetTier, failRateBand, profileOverrides) {
  const tier = TIER_DEFAULTS[targetTier];
  const failDefaults = FAIL_BAND_DEFAULTS[failRateBand];

  if (!tier || !failDefaults) {
    throw new Error(`Unsupported target tier/fail-rate combo: ${targetTier}/${failRateBand}`);
  }

  const target_casts_to_defeat = tier.target_casts_to_defeat + profileOverrides.target_casts_to_defeat_delta;
  const target_spell_count_on_win = failDefaults.target_spell_count_on_win + profileOverrides.target_spell_count_on_win_delta;

  if (target_casts_to_defeat <= 0 || target_spell_count_on_win <= 0) {
    throw new Error('Invalid profile override: casts-to-defeat and target spell count must remain positive.');
  }

  return {
    avg_word_length: tier.avg_word_length,
    weakness_hit_rate: clamp01(tier.weakness_hit_rate + profileOverrides.weakness_hit_rate_delta),
    wand_incidence: clamp01(tier.wand_incidence + profileOverrides.wand_incidence_delta),
    soot_exposure: clamp01(tier.soot_exposure + profileOverrides.soot_exposure_delta),
    target_casts_to_defeat,
    target_spell_count_on_win
  };
}

export function deriveEncounterNumbers(targetTier, failRateBand, profile) {
  const expected_matchup_multiplier = profile.weakness_hit_rate * 1.5 + (1 - profile.weakness_hit_rate) * 1;
  const expected_wand_multiplier = 1 + profile.wand_incidence * 0.25;
  const expected_soot_multiplier = 1 - profile.soot_exposure * 0.25;
  const expected_base_damage = 8 + 3 * (profile.avg_word_length - 3) + Math.max(0, profile.avg_word_length - 5);
  const expected_damage_per_cast = expected_base_damage * expected_matchup_multiplier * expected_wand_multiplier * expected_soot_multiplier;

  const raw_hp = profile.target_casts_to_defeat * expected_damage_per_cast;
  const quantizationStep = targetTier === 'boss' || targetTier === 'event' ? 4 : 2;
  const derived_hp = Math.max(1, quantize(raw_hp, quantizationStep));

  const raw_move_budget = profile.target_casts_to_defeat * (1 + FAIL_BAND_DEFAULTS[failRateBand].efficiency_slack);
  const derived_move_budget = Math.ceil(raw_move_budget);

  const target_casts_per_spell = profile.target_casts_to_defeat / profile.target_spell_count_on_win;
  const raw_base_countdown = target_casts_per_spell * (1 - profile.weakness_hit_rate);
  const [minCountdown, maxCountdown] = COUNTDOWN_GUARDRAILS[targetTier];
  const derived_base_countdown = clamp(Math.round(raw_base_countdown), minCountdown, maxCountdown);

  return {
    expected_damage_per_cast,
    derived_hp,
    derived_move_budget,
    derived_base_countdown,
    target_casts_to_defeat: profile.target_casts_to_defeat,
    target_spell_count_on_win: profile.target_spell_count_on_win
  };
}

function quantize(value, step) {
  return Math.round(value / step) * step;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function clamp01(value) {
  return clamp(value, 0, 1);
}
