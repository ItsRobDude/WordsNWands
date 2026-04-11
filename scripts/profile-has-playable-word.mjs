import { performance } from "node:perf_hooks";

import { createLocalContentPackageLoader } from "../packages/content/src/runtime/localContentPackageLoader.js";
import { InMemoryValidationSnapshotLookup } from "../packages/validation/src/index.ts";
import { hasPlayableWord } from "../packages/game-rules/src/board/hasPlayableWord.ts";
import { runEncounterHeadless } from "../packages/game-rules/src/simulation/runEncounterHeadless.ts";

const HYDRATION_SAMPLE_SIZE = 30;
const BOARD_CHECK_SAMPLE_SIZE = 250;

const loader = createLocalContentPackageLoader();
const validationSnapshot = loader.loadValidationSnapshot();
const starterPayload = loader.loadEncounterById("enc_starter_001");
const meadowPayload = loader.loadEncounterById("enc_meadow_001");

const STARTER_BOARD_ROWS = [
  "LEAFBE",
  "SUNGLO",
  "PATHRI",
  "VINEMO",
  "CALMST",
  "WINDRA",
];

const MEADOW_BOARD_ROWS = [
  "LEAFBE",
  "SUNGLO",
  "PATHRI",
  "MAGICV",
  "INESTA",
  "RWINDM",
];

const STARTER_SEED = "starter_opening_script_v1";

const hydrationSamples = [];
for (let index = 0; index < HYDRATION_SAMPLE_SIZE; index += 1) {
  if (typeof global.gc === "function") {
    global.gc();
  }

  const memoryBefore = process.memoryUsage().heapUsed;
  const startedAt = performance.now();
  const lookup = new InMemoryValidationSnapshotLookup(validationSnapshot);
  const elapsedMs = performance.now() - startedAt;
  const memoryAfter = process.memoryUsage().heapUsed;

  hydrationSamples.push({
    elapsed_ms: elapsedMs,
    memory_delta_bytes: Math.max(0, memoryAfter - memoryBefore),
    lookup_word_count: lookup.metadata.word_count,
  });
}

const lookup = new InMemoryValidationSnapshotLookup(validationSnapshot);
const starterBoard = createBoardFromRows(STARTER_BOARD_ROWS);
const meadowBoard = createBoardFromRows(MEADOW_BOARD_ROWS);
const starterPostSpell = createStarterPostSpellScenario({
  lookup,
  starterPayload,
});

const boardChecks = [
  profileBoardCheck({
    scenario_id: "starter_opening_board",
    board: starterBoard,
    repeated_words: [],
    lookup,
  }),
  profileBoardCheck({
    scenario_id: "starter_post_spell_board",
    board: starterPostSpell.board,
    repeated_words: starterPostSpell.repeated_words,
    lookup,
  }),
  profileBoardCheck({
    scenario_id: "meadow_opening_board",
    board: meadowBoard,
    repeated_words: [],
    lookup,
  }),
];

const report = {
  generated_at_utc: new Date().toISOString(),
  environment: {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    sample_sizes: {
      hydration: HYDRATION_SAMPLE_SIZE,
      board_check: BOARD_CHECK_SAMPLE_SIZE,
    },
    measurement_method:
      "node:perf_hooks performance.now + process.memoryUsage.heapUsed",
    gc_exposed: typeof global.gc === "function",
    note: "Desktop/local profile for regression detection. Not a representative low-end Android certification run.",
  },
  validation_snapshot: {
    snapshot_version: validationSnapshot.metadata.snapshot_version,
    word_count: validationSnapshot.metadata.word_count,
    tagged_word_count: validationSnapshot.metadata.tagged_word_count,
  },
  hydration: summarizeHydrationSamples(hydrationSamples),
  board_checks: boardChecks,
};

console.log(JSON.stringify(report, null, 2));

function createStarterPostSpellScenario(input) {
  const guidedCast =
    input.starterPayload.encounter.starterTutorialScript.guidedFirstCast;
  const result = runEncounterHeadless({
    encounter: {
      encounter_session_id: `${input.starterPayload.id}::${STARTER_SEED}::session`,
      encounter_id: input.starterPayload.encounter.id,
      encounter_seed: STARTER_SEED,
      board: createBoardFromRows(STARTER_BOARD_ROWS),
      creature: {
        creature_id: input.starterPayload.creature.id,
        display_name: input.starterPayload.creature.displayName,
        encounter_type: input.starterPayload.creature.encounterType,
        difficulty_tier: input.starterPayload.creature.difficultyTier,
        weakness_element: input.starterPayload.creature.weakness,
        resistance_element: input.starterPayload.creature.resistance,
        hp_current: input.starterPayload.creature.maxHp,
        hp_max: input.starterPayload.creature.maxHp,
        spell_countdown_current: 1,
        spell_countdown_reset: input.starterPayload.creature.baseCountdown,
      },
      move_budget_total: input.starterPayload.encounter.moveBudget,
      session_state: "in_progress",
      validation: {
        validation_lookup: input.lookup,
      },
      creature_spell_primitives: input.starterPayload.creature.spellPrimitives,
    },
    cast_submissions: [
      {
        selected_positions: guidedCast.selectedPositions.map((position) => ({
          ...position,
        })),
        traced_word_display: guidedCast.normalizedWord.toUpperCase(),
      },
    ],
  });

  return {
    board: result.terminal_snapshot.board,
    repeated_words: result.terminal_snapshot.repeated_words,
  };
}

function createBoardFromRows(rows) {
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
    tiles: rows.flatMap((letters, row) =>
      [...letters].map((letter, col) => ({
        id: `r${row}c${col}-${letter}`,
        letter,
        position: { row, col },
        state: null,
        state_turns_remaining: null,
        special_marker: null,
      })),
    ),
    rng_stream_states: {
      board_fill_stream_state: "profile::board_fill::0",
      creature_spell_stream_state: "profile::creature_spell::0",
      spark_shuffle_stream_state: "profile::spark_shuffle::0",
    },
  };
}

function profileBoardCheck(input) {
  const samples = [];
  let finalResult = false;

  for (let index = 0; index < BOARD_CHECK_SAMPLE_SIZE; index += 1) {
    const startedAt = performance.now();
    finalResult = hasPlayableWord({
      board: input.board,
      repeated_words: input.repeated_words,
      validation_lookup: input.lookup,
    });
    samples.push(performance.now() - startedAt);
  }

  return {
    scenario_id: input.scenario_id,
    result: finalResult,
    repeated_words_count: input.repeated_words.length,
    samples: summarizeLatencySamples(samples),
  };
}

function summarizeHydrationSamples(samples) {
  return {
    latency_ms: summarizeLatencySamples(
      samples.map((sample) => sample.elapsed_ms),
    ),
    memory_delta_bytes: summarizeDistribution(
      samples.map((sample) => sample.memory_delta_bytes),
    ),
  };
}

function summarizeLatencySamples(samples) {
  const summary = summarizeDistribution(samples);

  return {
    min: round(summary.min),
    p50: round(summary.p50),
    p95: round(summary.p95),
    p99: round(summary.p99),
    max: round(summary.max),
    mean: round(summary.mean),
  };
}

function summarizeDistribution(samples) {
  const sorted = [...samples].sort((left, right) => left - right);
  return {
    min: sorted[0] ?? 0,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted[sorted.length - 1] ?? 0,
    mean:
      sorted.length === 0
        ? 0
        : sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
  };
}

function percentile(sorted, ratio) {
  if (sorted.length === 0) {
    return 0;
  }

  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * ratio) - 1),
  );

  return sorted[index];
}

function round(value) {
  return Number(value.toFixed(4));
}
