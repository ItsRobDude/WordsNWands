import {
  createAuthoredBoard,
  createEncounterRuntimeState,
  createInitialBoard,
  createSeededEncounterRngStreamStates,
  isBoardAccepted,
  restoreEncounterRuntimeState,
  runEncounterHeadless,
  type BoardPosition,
  type EncounterRuntimeState,
  type EncounterVersionPins,
  type HeadlessTranscriptEntry,
} from "../../../../packages/game-rules/src/index.ts";
import {
  InMemoryValidationSnapshotLookup,
  normalizeTracedBoardLetters,
  type ValidationSnapshotLookup,
} from "../../../../packages/validation/src/index.ts";
import type {
  BundledContentRuntime,
  RuntimeEncounterPayload,
} from "../../../../packages/content/src/runtime/createBundledContentRuntime.ts";
import type { RuntimeProgressionChapterDefinition } from "../../../../packages/content/src/runtime/contracts/progression.ts";

export interface ActiveEncounterContext {
  encounter_id: string;
  encounter_payload: RuntimeEncounterPayload;
  validation_lookup: ValidationSnapshotLookup;
  version_pins: Partial<EncounterVersionPins>;
  letter_pool: string[];
  attempt_number: number;
}

export const getBundledProgression = (content: BundledContentRuntime) =>
  content.progression;

export const getStarterEncounterId = (content: BundledContentRuntime): string =>
  content.progression.starter_encounter_id;

export const getPrimaryChapter = (
  content: BundledContentRuntime,
): RuntimeProgressionChapterDefinition =>
  content.progression.chapters
    .slice()
    .sort((left, right) => left.sort_index - right.sort_index)[0]!;

export const getEncounterPayload = (input: {
  content: BundledContentRuntime;
  encounter_id: string;
}): RuntimeEncounterPayload => {
  const encounterPayload = input.content.encounters_by_id[input.encounter_id];
  if (!encounterPayload) {
    throw new Error(`Unknown bundled encounter: ${input.encounter_id}`);
  }

  return encounterPayload;
};

export const buildEncounterContext = (input: {
  content: BundledContentRuntime;
  encounter_id: string;
  attempt_number: number;
}): ActiveEncounterContext => {
  const encounter_payload = getEncounterPayload({
    content: input.content,
    encounter_id: input.encounter_id,
  });

  return {
    encounter_id: encounter_payload.id,
    encounter_payload,
    validation_lookup: new InMemoryValidationSnapshotLookup(
      input.content.validation_snapshot,
    ),
    version_pins: buildVersionPins(input.content),
    letter_pool: buildLetterPool(encounter_payload),
    attempt_number: input.attempt_number,
  };
};

export const createFreshEncounterRuntime = (input: {
  content: BundledContentRuntime;
  encounter_id: string;
  attempt_number: number;
}): {
  context: ActiveEncounterContext;
  runtime_state: EncounterRuntimeState;
} => {
  const context = buildEncounterContext(input);
  const encounterSeed = resolveEncounterSeed({
    encounter_payload: context.encounter_payload,
    attempt_number: input.attempt_number,
  });
  const rng_stream_states = createSeededEncounterRngStreamStates({
    encounter_seed: encounterSeed,
    encounter_id: context.encounter_payload.id,
  });
  const boardBase = {
    width: context.encounter_payload.encounter.boardConfig.cols,
    height: context.encounter_payload.encounter.boardConfig.rows,
    rng_stream_states,
  };
  const openingBoard = resolveOpeningBoard({
    encounter_payload: context.encounter_payload,
    board_base: boardBase,
    letter_pool: context.letter_pool,
    validation_lookup: context.validation_lookup,
  });

  return {
    context,
    runtime_state: createEncounterRuntimeState({
      encounter_session_id: `${context.encounter_payload.id}-attempt-${input.attempt_number}`,
      encounter_id: context.encounter_payload.id,
      encounter_seed: encounterSeed,
      board: openingBoard,
      creature: {
        creature_id: context.encounter_payload.creature.id,
        display_name: context.encounter_payload.creature.displayName,
        encounter_type: context.encounter_payload.creature.encounterType,
        difficulty_tier: context.encounter_payload.creature.difficultyTier,
        weakness_element: context.encounter_payload.creature.weakness,
        resistance_element: context.encounter_payload.creature.resistance,
        hp_current: context.encounter_payload.creature.maxHp,
        hp_max: context.encounter_payload.creature.maxHp,
        spell_countdown_current:
          context.encounter_payload.creature.baseCountdown,
        spell_countdown_reset: context.encounter_payload.creature.baseCountdown,
      },
      move_budget_total: context.encounter_payload.encounter.moveBudget,
      session_state: "in_progress",
      updated_at_utc: "2026-04-11T00:00:00.000Z",
      version_pins: buildVersionPins(input.content),
    }),
  };
};

export const restorePersistedEncounterRuntime = (input: {
  content: BundledContentRuntime;
  encounter_id: string;
  runtime_state_json: string;
  session_state: EncounterRuntimeState["session_state"];
  terminal_reason_code: EncounterRuntimeState["terminal_reason_code"];
  last_persisted_at_utc: string;
}): {
  context: ActiveEncounterContext;
  runtime_state: EncounterRuntimeState;
} => ({
  context: buildEncounterContext({
    content: input.content,
    encounter_id: input.encounter_id,
    attempt_number: inferAttemptNumberFromSerializedState(
      input.runtime_state_json,
    ),
  }),
  runtime_state: restoreEncounterRuntimeState(input),
});

export const deriveWordPreviewFromSelection = (input: {
  runtime_state: EncounterRuntimeState | null;
  selected_positions: readonly BoardPosition[];
}): string => {
  if (!input.runtime_state || input.selected_positions.length === 0) {
    return "";
  }

  const tileMap = new Map(
    input.runtime_state.board.tiles.map((tile) => [
      `${tile.position.row}:${tile.position.col}`,
      tile.letter,
    ]),
  );

  return normalizeTracedBoardLetters(
    input.selected_positions
      .map((position) => tileMap.get(`${position.row}:${position.col}`) ?? "")
      .filter((letter) => letter.length > 0),
  );
};

export const applySelectionToEncounterRuntime = (input: {
  runtime_state: EncounterRuntimeState;
  context: ActiveEncounterContext;
  selected_positions: readonly BoardPosition[];
}): {
  runtime_state: EncounterRuntimeState;
  transcript_entry: HeadlessTranscriptEntry | null;
} => {
  const traced_word_display = deriveWordPreviewFromSelection({
    runtime_state: input.runtime_state,
    selected_positions: input.selected_positions,
  });

  if (!traced_word_display) {
    return {
      runtime_state: input.runtime_state,
      transcript_entry: null,
    };
  }

  const result = runEncounterHeadless({
    encounter: {
      encounter_session_id: input.runtime_state.encounter_session_id,
      encounter_id: input.runtime_state.encounter_id,
      encounter_seed: input.runtime_state.encounter_seed,
      board: {
        width: input.runtime_state.board.width,
        height: input.runtime_state.board.height,
        tiles: input.runtime_state.board.tiles,
      },
      letter_pool: input.context.letter_pool,
      rng_stream_states: input.runtime_state.board.rng_stream_states,
      creature: input.runtime_state.creature,
      move_budget_total: input.runtime_state.move_budget_total,
      version_pins: input.context.version_pins,
      moves_remaining: input.runtime_state.moves_remaining,
      repeated_words: input.runtime_state.repeated_words,
      casts_resolved_count: input.runtime_state.casts_resolved_count,
      spark_shuffle_retry_cap: input.runtime_state.spark_shuffle_retry_cap,
      spark_shuffle_retries_attempted:
        input.runtime_state.spark_shuffle_retries_attempted,
      spark_shuffle_fallback_outcome:
        input.runtime_state.spark_shuffle_fallback_outcome,
      updated_at_utc: input.runtime_state.updated_at_utc,
      session_state:
        input.runtime_state.session_state === "in_progress"
          ? "in_progress"
          : "intro_presented",
      validation: {
        validation_lookup: input.context.validation_lookup,
      },
      minimum_playable_word_count_after_refill:
        resolveRefillMinimumPlayableWordCount(input.context.encounter_payload),
      minimum_vowel_class_count:
        input.context.encounter_payload.encounter.boardConfig.boardQualityPolicy
          ?.minVowelClassCount ?? null,
      vowel_class_includes_y:
        input.context.encounter_payload.encounter.boardConfig
          .vowelClassIncludesY,
      creature_spell_primitives:
        input.context.encounter_payload.creature.spellPrimitives,
    },
    cast_submissions: [
      {
        selected_positions: input.selected_positions.map((position) => ({
          row: position.row,
          col: position.col,
        })),
        traced_word_display: traced_word_display.toUpperCase(),
      },
    ],
  });

  return {
    runtime_state: result.terminal_snapshot,
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
  validation_lookup: ValidationSnapshotLookup;
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

  let current_board_base = input.board_base;
  let accepted_board = createInitialBoard({
    board: current_board_base,
    letter_pool: input.letter_pool,
  }).board;
  const acceptance_policy = createOpeningBoardAcceptancePolicy({
    encounter_payload: input.encounter_payload,
    validation_lookup: input.validation_lookup,
  });

  if (!acceptance_policy) {
    return accepted_board;
  }

  for (let attempt_index = 0; attempt_index < 64; attempt_index += 1) {
    if (
      isBoardAccepted({
        board: accepted_board,
        policy: acceptance_policy,
      })
    ) {
      return accepted_board;
    }

    current_board_base = {
      width: accepted_board.width,
      height: accepted_board.height,
      rng_stream_states: accepted_board.rng_stream_states,
    };
    accepted_board = createInitialBoard({
      board: current_board_base,
      letter_pool: input.letter_pool,
    }).board;
  }

  return accepted_board;
};

const resolveEncounterSeed = (input: {
  encounter_payload: RuntimeEncounterPayload;
  attempt_number: number;
}): string => {
  const openingSource =
    input.encounter_payload.encounter.starterTutorialScript?.starterBoardOpening
      .openingBoardSource;

  if (
    openingSource?.mode === "authored_seed" &&
    typeof openingSource.authoredSeed === "string"
  ) {
    return openingSource.authoredSeed;
  }

  if (
    input.encounter_payload.encounter.boardConfig.seedMode === "fixed_seed" &&
    input.encounter_payload.encounter.boardConfig.fixedSeed
  ) {
    return input.encounter_payload.encounter.boardConfig.fixedSeed;
  }

  return `${input.encounter_payload.id}-attempt-${input.attempt_number}`;
};

const inferAttemptNumberFromSerializedState = (
  runtime_state_json: string,
): number => {
  try {
    const parsed = JSON.parse(runtime_state_json) as {
      encounter_session_id?: string;
    };
    const match = parsed.encounter_session_id?.match(/-attempt-(\d+)$/);
    if (!match) {
      return 1;
    }

    return Number.parseInt(match[1] ?? "1", 10) || 1;
  } catch {
    return 1;
  }
};

const buildVersionPins = (
  content: BundledContentRuntime,
): Partial<EncounterVersionPins> => ({
  content_version_pin: content.manifest.content_version,
  validation_snapshot_version_pin: content.manifest.validation_snapshot_version,
  battle_rules_version_pin: content.manifest.battle_rules_version,
  board_generator_version_pin: content.manifest.board_generator_version,
});

const createOpeningBoardAcceptancePolicy = (input: {
  encounter_payload: RuntimeEncounterPayload;
  validation_lookup: ValidationSnapshotLookup;
}) => ({
  minimum_playable_word_count: resolveOpeningMinimumPlayableWordCount(
    input.encounter_payload,
  ),
  repeated_words: [],
  validation_lookup: input.validation_lookup,
  minimum_vowel_class_count:
    input.encounter_payload.encounter.boardConfig.boardQualityPolicy
      ?.minVowelClassCount ?? null,
  vowel_class_includes_y:
    input.encounter_payload.encounter.boardConfig.vowelClassIncludesY,
});

const resolveOpeningMinimumPlayableWordCount = (
  encounter_payload: RuntimeEncounterPayload,
): number =>
  encounter_payload.encounter.isStarterEncounter
    ? 6
    : encounter_payload.encounter.balanceMetadata.authoredFailRateBand === "low"
      ? 5
      : encounter_payload.encounter.balanceMetadata.authoredFailRateBand ===
          "medium"
        ? 3
        : 2;

const resolveRefillMinimumPlayableWordCount = (
  encounter_payload: RuntimeEncounterPayload,
): number =>
  encounter_payload.encounter.isStarterEncounter
    ? 4
    : encounter_payload.encounter.balanceMetadata.authoredFailRateBand === "low"
      ? 3
      : encounter_payload.encounter.balanceMetadata.authoredFailRateBand ===
          "medium"
        ? 2
        : 1;
