import {
  normalizeWord,
  resolveElementForWord,
  type ValidationSnapshotLookup,
} from "../../../validation/src/index.ts";

import type { EncounterRuntimeState } from "../contracts/board.js";
import type { CastResolution, CastSubmission } from "../contracts/cast.js";
import type {
  BoardPosition,
  CastRejectionReason,
  ElementType,
  MatchupResult,
} from "../contracts/index.js";
import { applyCountdownStep } from "./applyCountdownStep.ts";

export interface ValidateCastSubmissionInput {
  encounter_state: EncounterRuntimeState;
  submission: CastSubmission;
  validation_lookup: ValidationSnapshotLookup;
  compute_damage?: (input: {
    normalized_word: string;
    word_length: number;
    matchup_result: MatchupResult;
  }) => number;
  minimum_word_length?: number;
}

export interface ValidateCastSubmissionResult {
  cast_resolution: CastResolution;
  normalized_word: string;
}

const DEFAULT_MINIMUM_WORD_LENGTH = 3;

export const validateCastSubmission = ({
  encounter_state,
  submission,
  validation_lookup,
  compute_damage,
  minimum_word_length = DEFAULT_MINIMUM_WORD_LENGTH,
}: ValidateCastSubmissionInput): ValidateCastSubmissionResult => {
  const normalized_word = normalizeWord(submission.traced_word_display);

  const illegal_path_reason = validatePath(submission.selected_positions);
  if (illegal_path_reason) {
    return {
      cast_resolution: {
        submission_kind: "invalid",
        rejection_reason: illegal_path_reason,
      },
      normalized_word,
    };
  }

  if (normalized_word.length < minimum_word_length) {
    return {
      cast_resolution: {
        submission_kind: "invalid",
        rejection_reason: "too_short",
      },
      normalized_word,
    };
  }

  const selected_tile_states = lookupSelectedTileStates({
    encounter_state,
    selected_positions: submission.selected_positions,
  });

  if (selected_tile_states.some((tile_state) => tile_state === "frozen")) {
    return {
      cast_resolution: {
        submission_kind: "invalid",
        rejection_reason: "blocked_by_tile_state",
      },
      normalized_word,
    };
  }

  if (!validation_lookup.hasWord(normalized_word)) {
    return {
      cast_resolution: {
        submission_kind: "invalid",
        rejection_reason: "not_in_lexicon",
      },
      normalized_word,
    };
  }

  if (encounter_state.repeated_words.includes(normalized_word)) {
    return {
      cast_resolution: {
        submission_kind: "repeated",
        rejection_reason: "repeated_word",
      },
      normalized_word,
    };
  }

  const element =
    resolveElementForWord(normalized_word, validation_lookup) ?? "arcane";
  const matchup_result = resolveMatchupResult({
    element,
    encounter_state,
    selected_tile_states,
  });
  const countdown_step = applyCountdownStep({
    encounter_state,
    matchup_result,
  });
  const damage_applied = Math.max(
    0,
    Math.floor(
      compute_damage?.({
        normalized_word,
        word_length: normalized_word.length,
        matchup_result,
      }) ?? normalized_word.length,
    ),
  );

  return {
    cast_resolution: {
      submission_kind: "valid",
      normalized_word,
      element,
      matchup_result,
      damage_applied,
      countdown_after_cast: countdown_step.countdown_after,
      countdown_decremented: countdown_step.countdown_decremented,
      moves_remaining_after_cast: Math.max(
        0,
        encounter_state.moves_remaining - 1,
      ),
    },
    normalized_word,
  };
};

const validatePath = (
  positions: readonly BoardPosition[],
): CastRejectionReason | null => {
  if (positions.length === 0) {
    return "illegal_path";
  }

  const seen = new Set<string>();

  for (let index = 0; index < positions.length; index += 1) {
    const current = positions[index];
    const key = `${current.row}:${current.col}`;

    if (seen.has(key)) {
      return "illegal_path";
    }

    seen.add(key);

    if (index === 0) {
      continue;
    }

    const previous = positions[index - 1];
    const row_delta = Math.abs(current.row - previous.row);
    const col_delta = Math.abs(current.col - previous.col);
    const is_adjacent =
      row_delta <= 1 && col_delta <= 1 && row_delta + col_delta > 0;

    if (!is_adjacent) {
      return "illegal_path";
    }
  }

  return null;
};

const lookupSelectedTileStates = (input: {
  encounter_state: EncounterRuntimeState;
  selected_positions: readonly BoardPosition[];
}): Array<EncounterRuntimeState["board"]["tiles"][number]["state"]> => {
  const state_by_position = new Map(
    input.encounter_state.board.tiles.map((tile) => [
      `${tile.position.row}:${tile.position.col}`,
      tile.state,
    ]),
  );

  return input.selected_positions.map(
    (position) =>
      state_by_position.get(`${position.row}:${position.col}`) ?? null,
  );
};

const resolveMatchupResult = (input: {
  element: ElementType;
  encounter_state: EncounterRuntimeState;
  selected_tile_states: readonly EncounterRuntimeState["board"]["tiles"][number]["state"][];
}): MatchupResult => {
  if (input.selected_tile_states.some((state) => state === "dull")) {
    return "neutral";
  }

  if (input.element === input.encounter_state.creature.weakness_element) {
    return "weakness";
  }

  if (input.element === input.encounter_state.creature.resistance_element) {
    return "resistance";
  }

  return "neutral";
};
