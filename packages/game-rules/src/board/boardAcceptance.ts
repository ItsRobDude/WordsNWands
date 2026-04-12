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
}

export const isBoardAccepted = (input: {
  board: BoardSnapshot;
  policy: BoardAcceptancePolicy;
}): boolean => {
  const playableWordCount = countPlayableWordsUpToLimit({
    board: input.board,
    repeated_words: input.policy.repeated_words,
    validation_lookup: input.policy.validation_lookup,
    minimum_length: input.policy.minimum_length,
    limit: input.policy.minimum_playable_word_count,
  });

  if (playableWordCount < input.policy.minimum_playable_word_count) {
    return false;
  }

  if (
    input.policy.minimum_vowel_class_count &&
    countVowelClassTiles({
      board: input.board,
      include_y: input.policy.vowel_class_includes_y ?? false,
    }) < input.policy.minimum_vowel_class_count
  ) {
    return false;
  }

  return true;
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
