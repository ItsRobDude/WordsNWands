import {
  countPlayableWordsUpToLimit as countPlayableWordsFromValidation,
  hasPlayableWord as hasPlayableWordFromValidation,
  type PlayableBoardGrid,
  type ValidationSnapshotLookup,
} from "../../../validation/src/index.ts";

import type { BoardSnapshot } from "../contracts/board.js";

export interface HasPlayableWordInput {
  board: BoardSnapshot;
  repeated_words: readonly string[];
  validation_lookup: ValidationSnapshotLookup;
  minimum_length?: number;
}

export interface CountPlayableWordsInput extends HasPlayableWordInput {
  limit: number;
}

export const hasPlayableWord = ({
  board,
  repeated_words,
  validation_lookup,
  minimum_length = 3,
}: HasPlayableWordInput): boolean =>
  hasPlayableWordFromValidation({
    board: toPlayableBoardGrid(board),
    repeated_words: new Set(repeated_words),
    validation_lookup,
    minimum_length,
  });

export const countPlayableWordsUpToLimit = ({
  board,
  repeated_words,
  validation_lookup,
  minimum_length = 3,
  limit,
}: CountPlayableWordsInput): number =>
  countPlayableWordsFromValidation({
    board: toPlayableBoardGrid(board),
    repeated_words: new Set(repeated_words),
    validation_lookup,
    minimum_length,
    limit,
  });

const toPlayableBoardGrid = (board: BoardSnapshot): PlayableBoardGrid => {
  if (board.height <= 0 || board.width <= 0) {
    return [];
  }

  const grid = Array.from({ length: board.height }, () =>
    Array.from({ length: board.width }, () => ({
      letter: "a",
      blocked: true,
    })),
  );

  for (const tile of board.tiles) {
    const { row, col } = tile.position;
    if (row < 0 || row >= board.height || col < 0 || col >= board.width) {
      continue;
    }

    grid[row][col] = {
      letter: tile.letter,
      blocked: tile.state === "frozen",
    };
  }

  return grid;
};
