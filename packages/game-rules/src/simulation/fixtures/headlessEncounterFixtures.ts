import type { ValidationSnapshotLookup } from "../../../../validation/src/index.ts";

import type { HeadlessEncounterDefinition } from "../runEncounterHeadless.ts";

const FIXTURE_VERSION_PINS = {
  content_version_pin: "content_fixture_v1",
  validation_snapshot_version_pin: "validation_fixture_v1",
  battle_rules_version_pin: "battle_rules_fixture_v1",
  board_generator_version_pin: "board_generator_fixture_v1",
  reward_constants_version_pin: "reward_constants_fixture_v1",
} as const;

const createValidationLookup = (
  words: readonly string[],
): ValidationSnapshotLookup => {
  const entries = new Map(
    words.map((word) => [
      word,
      { normalized_word: word, element: "flame" as const },
    ]),
  );

  return {
    snapshot_version: "headless_fixture_snapshot",
    metadata: {
      snapshot_version: "headless_fixture_snapshot",
      language: "en",
      word_count: entries.size,
      tagged_word_count: entries.size,
      generated_at_utc: "2026-04-11T00:00:00.000Z",
    },
    hasWord: (normalizedWord) => entries.has(normalizedWord),
    getEntry: (normalizedWord) => entries.get(normalizedWord) ?? null,
  };
};

export const starterEncounterFixture: HeadlessEncounterDefinition = {
  encounter_session_id: "starter-session-001",
  encounter_id: "encounter-starter-001",
  encounter_seed: "starter-seed-001",
  board: {
    width: 2,
    height: 2,
    tiles: [
      {
        id: "t-0-0",
        letter: "C",
        position: { row: 0, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "t-0-1",
        letter: "A",
        position: { row: 0, col: 1 },
        state: null,
        special_marker: null,
      },
      {
        id: "t-1-0",
        letter: "B",
        position: { row: 1, col: 0 },
        state: null,
        special_marker: "wand",
      },
      {
        id: "t-1-1",
        letter: "D",
        position: { row: 1, col: 1 },
        state: null,
        special_marker: null,
      },
    ],
  },
  creature: {
    creature_id: "creature-starter",
    display_name: "Starter Sprite",
    encounter_type: "standard",
    difficulty_tier: "gentle",
    weakness_element: "flame",
    resistance_element: "tide",
    hp_current: 3,
    hp_max: 3,
    spell_countdown_current: 2,
    spell_countdown_reset: 2,
  },
  move_budget_total: 2,
  version_pins: FIXTURE_VERSION_PINS,
  session_state: "in_progress",
  validation: {
    validation_lookup: createValidationLookup(["cab", "bad", "dab"]),
  },
};

export const firstStandardEncounterFixture: HeadlessEncounterDefinition = {
  encounter_session_id: "standard-session-001",
  encounter_id: "encounter-standard-001",
  encounter_seed: "standard-seed-001",
  board: {
    width: 2,
    height: 2,
    tiles: [
      {
        id: "s-0-0",
        letter: "F",
        position: { row: 0, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "s-0-1",
        letter: "A",
        position: { row: 0, col: 1 },
        state: null,
        special_marker: null,
      },
      {
        id: "s-1-0",
        letter: "C",
        position: { row: 1, col: 0 },
        state: null,
        special_marker: null,
      },
      {
        id: "s-1-1",
        letter: "E",
        position: { row: 1, col: 1 },
        state: null,
        special_marker: null,
      },
    ],
  },
  creature: {
    creature_id: "creature-standard-001",
    display_name: "First Standard Goblin",
    encounter_type: "standard",
    difficulty_tier: "standard",
    weakness_element: "bloom",
    resistance_element: "flame",
    hp_current: 9,
    hp_max: 9,
    spell_countdown_current: 2,
    spell_countdown_reset: 2,
  },
  move_budget_total: 1,
  version_pins: FIXTURE_VERSION_PINS,
  session_state: "in_progress",
  validation: {
    validation_lookup: createValidationLookup(["face", "cafe", "deaf"]),
  },
};
