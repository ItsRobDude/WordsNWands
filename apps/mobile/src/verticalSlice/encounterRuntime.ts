import {
  createAuthoredBoard,
  createEncounterRuntimeState,
  createInitialBoard,
  createSeededEncounterRngStreamStates,
  runEncounterHeadless,
  type CastSubmission,
  type EncounterRuntimeState,
  type HeadlessTranscriptEntry,
  type EncounterVersionPins,
} from "../../../../packages/game-rules/src/index.ts";
import {
  InMemoryValidationSnapshotLookup,
  type ValidationSnapshotLookup,
} from "../../../../packages/validation/src/index.ts";
import type { RuntimeProgressionChapterDefinition } from "../../../../packages/content/src/runtime/contracts/progression.ts";
import {
  getBundledPhaseOneContent,
  type RuntimeEncounterPayload,
} from "./bundledContent.ts";

export interface MobileEncounterRun {
  encounter_id: string;
  encounter_payload: RuntimeEncounterPayload;
  runtime_state: EncounterRuntimeState;
  validation_lookup: ValidationSnapshotLookup;
  letter_pool: string[];
  attempt_number: number;
}

const bundledContent = getBundledPhaseOneContent();
const validationLookup = new InMemoryValidationSnapshotLookup(
  bundledContent.validation_snapshot,
);

export const getBundledProgression = () => bundledContent.progression;

export const getStarterEncounterId = (): string =>
  bundledContent.progression.starter_encounter_id;

export const getPrimaryChapter = (): RuntimeProgressionChapterDefinition =>
  bundledContent.progression.chapters
    .slice()
    .sort((left, right) => left.sort_index - right.sort_index)[0]!;

export const getEncounterPayload = (
  encounterId: string,
): RuntimeEncounterPayload => {
  const encounterPayload = bundledContent.encounters_by_id[encounterId];
  if (!encounterPayload) {
    throw new Error(`Unknown bundled encounter: ${encounterId}`);
  }

  return encounterPayload;
};

export const createFreshEncounterRun = (input: {
  encounter_id: string;
  attempt_number: number;
}): MobileEncounterRun => {
  const encounterPayload = getEncounterPayload(input.encounter_id);
  const encounterSeed = resolveEncounterSeed(
    encounterPayload,
    input.attempt_number,
  );
  const rng_stream_states = createSeededEncounterRngStreamStates({
    encounter_seed: encounterSeed,
    encounter_id: encounterPayload.id,
  });
  const letter_pool = buildLetterPool(encounterPayload);
  const boardBase = {
    width: encounterPayload.encounter.boardConfig.cols,
    height: encounterPayload.encounter.boardConfig.rows,
    rng_stream_states,
  };
  const openingBoard = resolveOpeningBoard({
    encounter_payload: encounterPayload,
    board_base: boardBase,
    letter_pool,
  });
  const runtimeState = createEncounterRuntimeState({
    encounter_session_id: `${encounterPayload.id}-attempt-${input.attempt_number}`,
    encounter_id: encounterPayload.id,
    encounter_seed: encounterSeed,
    board: openingBoard,
    creature: {
      creature_id: encounterPayload.creature.id,
      display_name: encounterPayload.creature.displayName,
      encounter_type: encounterPayload.creature.encounterType,
      difficulty_tier: encounterPayload.creature.difficultyTier,
      weakness_element: encounterPayload.creature.weakness,
      resistance_element: encounterPayload.creature.resistance,
      hp_current: encounterPayload.creature.maxHp,
      hp_max: encounterPayload.creature.maxHp,
      spell_countdown_current: encounterPayload.creature.baseCountdown,
      spell_countdown_reset: encounterPayload.creature.baseCountdown,
    },
    move_budget_total: encounterPayload.encounter.moveBudget,
    session_state: "in_progress",
    updated_at_utc: "2026-04-11T00:00:00.000Z",
    version_pins: buildVersionPins(),
  });

  return {
    encounter_id: encounterPayload.id,
    encounter_payload: encounterPayload,
    runtime_state: runtimeState,
    validation_lookup: validationLookup,
    letter_pool,
    attempt_number: input.attempt_number,
  };
};

export const applySubmissionToEncounterRun = (input: {
  run: MobileEncounterRun;
  submission: CastSubmission;
}): {
  run: MobileEncounterRun;
  transcript_entry: HeadlessTranscriptEntry | null;
} => {
  const result = runEncounterHeadless({
    encounter: {
      encounter_session_id: input.run.runtime_state.encounter_session_id,
      encounter_id: input.run.runtime_state.encounter_id,
      encounter_seed: input.run.runtime_state.encounter_seed,
      board: {
        width: input.run.runtime_state.board.width,
        height: input.run.runtime_state.board.height,
        tiles: input.run.runtime_state.board.tiles,
      },
      letter_pool: input.run.letter_pool,
      rng_stream_states: input.run.runtime_state.board.rng_stream_states,
      creature: input.run.runtime_state.creature,
      move_budget_total: input.run.runtime_state.move_budget_total,
      version_pins: buildVersionPins(),
      moves_remaining: input.run.runtime_state.moves_remaining,
      repeated_words: input.run.runtime_state.repeated_words,
      casts_resolved_count: input.run.runtime_state.casts_resolved_count,
      spark_shuffle_retry_cap: input.run.runtime_state.spark_shuffle_retry_cap,
      spark_shuffle_retries_attempted:
        input.run.runtime_state.spark_shuffle_retries_attempted,
      spark_shuffle_fallback_outcome:
        input.run.runtime_state.spark_shuffle_fallback_outcome,
      updated_at_utc: input.run.runtime_state.updated_at_utc,
      session_state:
        input.run.runtime_state.session_state === "in_progress"
          ? "in_progress"
          : "intro_presented",
      validation: {
        validation_lookup: input.run.validation_lookup,
      },
      creature_spell_primitives:
        input.run.encounter_payload.creature.spellPrimitives,
    },
    cast_submissions: [input.submission],
  });

  return {
    run: {
      ...input.run,
      runtime_state: result.terminal_snapshot,
    },
    transcript_entry: result.transcript.at(-1) ?? null,
  };
};

const buildLetterPool = (encounterPayload: RuntimeEncounterPayload): string[] =>
  encounterPayload.encounter.boardConfig.letterWeightEntries.flatMap((entry) =>
    Array.from(
      { length: Math.max(1, Math.floor(entry.weight)) },
      () => entry.letter,
    ),
  );

const resolveOpeningBoard = (input: {
  encounter_payload: RuntimeEncounterPayload;
  board_base: Parameters<typeof createInitialBoard>[0]["board"];
  letter_pool: string[];
}) => {
  const starterOpening =
    input.encounter_payload.encounter.starterTutorialScript?.starterBoardOpening
      .openingBoardSource;

  if (
    starterOpening?.mode === "authored_board" &&
    Array.isArray(starterOpening.authoredBoard)
  ) {
    return createAuthoredBoard({
      board: input.board_base,
      layout: starterOpening.authoredBoard,
    }).board;
  }

  return createInitialBoard({
    board: input.board_base,
    letter_pool: input.letter_pool,
  }).board;
};

const resolveEncounterSeed = (
  encounterPayload: RuntimeEncounterPayload,
  attemptNumber: number,
): string => {
  const openingSource =
    encounterPayload.encounter.starterTutorialScript?.starterBoardOpening
      .openingBoardSource;

  if (
    openingSource?.mode === "authored_seed" &&
    typeof openingSource.authoredSeed === "string"
  ) {
    return openingSource.authoredSeed;
  }

  if (
    encounterPayload.encounter.boardConfig.seedMode === "fixed_seed" &&
    encounterPayload.encounter.boardConfig.fixedSeed
  ) {
    return encounterPayload.encounter.boardConfig.fixedSeed;
  }

  return `${encounterPayload.id}-attempt-${attemptNumber}`;
};

const buildVersionPins = (): Partial<EncounterVersionPins> => ({
  content_version_pin: bundledContent.manifest.content_version,
  validation_snapshot_version_pin:
    bundledContent.manifest.validation_snapshot_version,
  battle_rules_version_pin: bundledContent.manifest.battle_rules_version,
  board_generator_version_pin: bundledContent.manifest.board_generator_version,
});
