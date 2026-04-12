import type { ValidationSnapshotLookup } from "../../../validation/src/index.ts";

import type { BoardSnapshot } from "../contracts/board.js";
import { countPlayableWordsUpToLimit } from "./hasPlayableWord.ts";

export interface BoardAcceptancePolicy {
  minimum_playable_word_count: number;
  repeated_words: readonly string[];
  validation_lookup: ValidationSnapshotLookup;
  minimum_length?: number;
  minimum_vowel_class_count?: number | null;
  vowel_class_includes_y?: boolean;
  target_playable_word_count?: number | null;
  playable_word_count_search_limit?: number;
}

export interface BoardQualityEvaluation {
  playable_word_count: number;
  vowel_class_count: number;
  accepted: boolean;
  score: number;
}

export const isBoardAccepted = (input: {
  board: BoardSnapshot;
  policy: BoardAcceptancePolicy;
}): boolean => {
  return evaluateBoardQuality(input).accepted;
};

export const evaluateBoardQuality = (input: {
  board: BoardSnapshot;
  policy: BoardAcceptancePolicy;
}): BoardQualityEvaluation => {
  const playable_word_count = countPlayableWordsUpToLimit({
    board: input.board,
    repeated_words: input.policy.repeated_words,
    validation_lookup: input.policy.validation_lookup,
    minimum_length: input.policy.minimum_length,
    limit: resolvePlayableWordSearchLimit(input.policy),
  });
  const vowel_class_count = countVowelClassTiles({
    board: input.board,
    include_y: input.policy.vowel_class_includes_y ?? false,
  });
  const accepted =
    playable_word_count >= input.policy.minimum_playable_word_count &&
    (!input.policy.minimum_vowel_class_count ||
      vowel_class_count >= input.policy.minimum_vowel_class_count);
  const target_playable_word_count = Math.max(
    input.policy.minimum_playable_word_count,
    input.policy.target_playable_word_count ??
      input.policy.minimum_playable_word_count,
  );
  const progress_toward_target = Math.min(
    playable_word_count,
    target_playable_word_count,
  );
  const overflow_beyond_target = Math.max(
    0,
    playable_word_count - target_playable_word_count,
  );

  return {
    playable_word_count,
    vowel_class_count,
    accepted,
    score:
      (accepted ? 1_000_000 : 0) +
      progress_toward_target * 10_000 +
      overflow_beyond_target * 500 +
      vowel_class_count,
  };
};

export const countVowelClassTiles = (input: {
  board: BoardSnapshot;
  include_y: boolean;
}): number => {
  const vowels = input.include_y ? "AEIOUY" : "AEIOU";

  return input.board.tiles.reduce(
    (count, tile) =>
      count + (vowels.includes(tile.letter.toUpperCase()) ? 1 : 0),
    0,
  );
};

const resolvePlayableWordSearchLimit = (
  policy: BoardAcceptancePolicy,
): number => {
  const floor = Math.max(
    policy.minimum_playable_word_count,
    policy.target_playable_word_count ?? policy.minimum_playable_word_count,
  );

  if (!policy.playable_word_count_search_limit) {
    return floor;
  }

  return Math.max(floor, policy.playable_word_count_search_limit);
};
