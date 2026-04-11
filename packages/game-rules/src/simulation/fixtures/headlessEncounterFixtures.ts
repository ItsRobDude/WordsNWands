import type { HeadlessEncounterDefinition } from "../runEncounterHeadless.ts";

const starterLexicon = new Set(["cab", "bad", "dab"]);
const standardLexicon = new Set(["face", "cafe", "deaf"]);

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
  session_state: "in_progress",
  validation: {
    has_word: (normalized_word) => starterLexicon.has(normalized_word),
    resolve_element: () => "flame",
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
    hp_current: 8,
    hp_max: 8,
    spell_countdown_current: 2,
    spell_countdown_reset: 2,
  },
  move_budget_total: 1,
  session_state: "in_progress",
  validation: {
    has_word: (normalized_word) => standardLexicon.has(normalized_word),
    resolve_element: () => "flame",
  },
};
