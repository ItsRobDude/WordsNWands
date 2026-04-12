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
  priority_words?: ReadonlySet<string>;
  minimum_priority_word_count?: number;
  target_priority_word_count?: number | null;
  priority_word_search_limit?: number;
  minimum_straight_priority_word_count?: number;
  target_straight_priority_word_count?: number | null;
  straight_priority_word_search_limit?: number;
  straight_priority_minimum_length?: number;
}

export interface BoardQualityEvaluation {
  playable_word_count: number;
  priority_playable_word_count: number;
  straight_priority_word_count: number;
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
  const priority_playable_word_count = input.policy.priority_words
    ? countPlayableWordsUpToLimit({
        board: input.board,
        repeated_words: input.policy.repeated_words,
        validation_lookup: input.policy.validation_lookup,
        minimum_length: input.policy.minimum_length,
        limit: resolvePriorityWordSearchLimit(input.policy),
        allowed_words: input.policy.priority_words,
      })
    : 0;
  const straight_priority_word_count =
    input.policy.priority_words &&
    (input.policy.minimum_straight_priority_word_count ??
      input.policy.target_straight_priority_word_count ??
      0) > 0
      ? countStraightPriorityWordsUpToLimit({
          board: input.board,
          repeated_words: input.policy.repeated_words,
          validation_lookup: input.policy.validation_lookup,
          minimum_length: input.policy.minimum_length,
          straight_priority_minimum_length:
            input.policy.straight_priority_minimum_length,
          allowed_words: input.policy.priority_words,
          limit: resolveStraightPriorityWordSearchLimit(input.policy),
        })
      : 0;
  const accepted =
    playable_word_count >= input.policy.minimum_playable_word_count &&
    priority_playable_word_count >=
      Math.max(0, input.policy.minimum_priority_word_count ?? 0) &&
    straight_priority_word_count >=
      Math.max(0, input.policy.minimum_straight_priority_word_count ?? 0) &&
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
  const target_priority_word_count = Math.max(
    input.policy.minimum_priority_word_count ?? 0,
    input.policy.target_priority_word_count ??
      input.policy.minimum_priority_word_count ??
      0,
  );
  const progress_toward_priority_target = Math.min(
    priority_playable_word_count,
    target_priority_word_count,
  );
  const overflow_beyond_priority_target = Math.max(
    0,
    priority_playable_word_count - target_priority_word_count,
  );
  const target_straight_priority_word_count = Math.max(
    input.policy.minimum_straight_priority_word_count ?? 0,
    input.policy.target_straight_priority_word_count ??
      input.policy.minimum_straight_priority_word_count ??
      0,
  );
  const progress_toward_straight_priority_target = Math.min(
    straight_priority_word_count,
    target_straight_priority_word_count,
  );
  const overflow_beyond_straight_priority_target = Math.max(
    0,
    straight_priority_word_count - target_straight_priority_word_count,
  );

  return {
    playable_word_count,
    priority_playable_word_count,
    straight_priority_word_count,
    vowel_class_count,
    accepted,
    score:
      (accepted ? 1_000_000 : 0) +
      progress_toward_straight_priority_target * 250_000 +
      overflow_beyond_straight_priority_target * 10_000 +
      progress_toward_priority_target * 100_000 +
      overflow_beyond_priority_target * 5_000 +
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

const resolvePriorityWordSearchLimit = (
  policy: BoardAcceptancePolicy,
): number => {
  const minimumPriorityWordCount = Math.max(
    0,
    policy.minimum_priority_word_count ?? 0,
  );
  const targetPriorityWordCount = Math.max(
    minimumPriorityWordCount,
    policy.target_priority_word_count ?? minimumPriorityWordCount,
  );

  if (!policy.priority_word_search_limit) {
    return targetPriorityWordCount;
  }

  return Math.max(targetPriorityWordCount, policy.priority_word_search_limit);
};

const STRAIGHT_DIRECTIONS = [
  [0, 1],
  [1, 0],
] as const;

const countStraightPriorityWordsUpToLimit = (input: {
  board: BoardSnapshot;
  repeated_words: readonly string[];
  validation_lookup: ValidationSnapshotLookup;
  minimum_length?: number;
  straight_priority_minimum_length?: number;
  allowed_words: ReadonlySet<string>;
  limit: number;
}): number => {
  const minimumLength =
    input.straight_priority_minimum_length ?? input.minimum_length ?? 3;
  const maxWordLength = Math.min(6, input.validation_lookup.getMaxWordLength());
  const repeatedWords = new Set(input.repeated_words);
  const foundWords = new Set<string>();
  const limit = Math.max(1, input.limit);

  for (const tile of input.board.tiles) {
    for (const [rowDelta, colDelta] of STRAIGHT_DIRECTIONS) {
      let normalizedWord = "";

      for (let length = 1; length <= maxWordLength; length += 1) {
        const row = tile.position.row + rowDelta * (length - 1);
        const col = tile.position.col + colDelta * (length - 1);
        const nextTile = input.board.tiles.find(
          (candidate) =>
            candidate.position.row === row &&
            candidate.position.col === col &&
            candidate.state !== "frozen",
        );
        if (!nextTile) {
          break;
        }

        normalizedWord += nextTile.letter.toLowerCase();
        if (!input.validation_lookup.hasPrefix(normalizedWord)) {
          break;
        }

        if (
          length >= minimumLength &&
          input.allowed_words.has(normalizedWord) &&
          !repeatedWords.has(normalizedWord) &&
          input.validation_lookup.hasWord(normalizedWord)
        ) {
          foundWords.add(normalizedWord);
          if (foundWords.size >= limit) {
            return limit;
          }
        }
      }
    }
  }

  return foundWords.size;
};

const resolveStraightPriorityWordSearchLimit = (
  policy: BoardAcceptancePolicy,
): number => {
  const minimumStraightPriorityWordCount = Math.max(
    0,
    policy.minimum_straight_priority_word_count ?? 0,
  );
  const targetStraightPriorityWordCount = Math.max(
    minimumStraightPriorityWordCount,
    policy.target_straight_priority_word_count ??
      minimumStraightPriorityWordCount,
  );

  if (!policy.straight_priority_word_search_limit) {
    return targetStraightPriorityWordCount;
  }

  return Math.max(
    targetStraightPriorityWordCount,
    policy.straight_priority_word_search_limit,
  );
};
