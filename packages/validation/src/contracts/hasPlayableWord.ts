import { normalizeTracedBoardLetters } from "./normalizeWord.ts";
import type { ValidationSnapshotLookup } from "./types.ts";

export interface PlayableBoardTile {
  letter: string;
  blocked: boolean;
}

export type PlayableBoardGrid = ReadonlyArray<ReadonlyArray<PlayableBoardTile>>;

export interface HasPlayableWordInput {
  board: PlayableBoardGrid;
  repeated_words: ReadonlySet<string>;
  validation_lookup: ValidationSnapshotLookup;
  minimum_length?: number;
}

export interface CountPlayableWordsInput extends HasPlayableWordInput {
  limit: number;
}

const ADJACENCY_DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

export function hasPlayableWord(input: HasPlayableWordInput): boolean {
  return (
    countPlayableWordsUpToLimit({
      ...input,
      limit: 1,
    }) > 0
  );
}

export function countPlayableWordsUpToLimit(
  input: CountPlayableWordsInput,
): number {
  const minLength = input.minimum_length ?? 3;
  const rowCount = input.board.length;
  if (rowCount === 0) return 0;

  const colCount = input.board[0]?.length ?? 0;
  if (colCount === 0) return 0;

  const maxWordLength = input.validation_lookup.getMaxWordLength();
  if (maxWordLength < minLength) {
    return 0;
  }

  const visited: boolean[][] = Array.from({ length: rowCount }, () =>
    Array(colCount).fill(false),
  );
  const foundWords = new Set<string>();
  const limit = Math.max(1, input.limit);

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      dfs(row, col, [], visited, input, minLength, foundWords, limit);
      if (foundWords.size >= limit) {
        return limit;
      }
    }
  }

  return foundWords.size;
}

function dfs(
  row: number,
  col: number,
  pathLetters: string[],
  visited: boolean[][],
  input: HasPlayableWordInput,
  minimumLength: number,
  foundWords: Set<string>,
  limit: number,
): void {
  const tile = input.board[row]?.[col];
  if (!tile || tile.blocked || visited[row][col]) {
    return;
  }

  visited[row][col] = true;
  pathLetters.push(tile.letter);
  const normalizedWord = normalizeTracedBoardLetters(pathLetters);

  if (!input.validation_lookup.hasPrefix(normalizedWord)) {
    visited[row][col] = false;
    pathLetters.pop();
    return;
  }

  if (pathLetters.length >= minimumLength) {
    const isRepeated = input.repeated_words.has(normalizedWord);
    if (!isRepeated && input.validation_lookup.hasWord(normalizedWord)) {
      foundWords.add(normalizedWord);
      if (foundWords.size >= limit) {
        visited[row][col] = false;
        pathLetters.pop();
        return;
      }
    }
  }

  if (pathLetters.length >= input.validation_lookup.getMaxWordLength()) {
    visited[row][col] = false;
    pathLetters.pop();
    return;
  }

  for (const [rowOffset, colOffset] of ADJACENCY_DIRECTIONS) {
    dfs(
      row + rowOffset,
      col + colOffset,
      pathLetters,
      visited,
      input,
      minimumLength,
      foundWords,
      limit,
    );
    if (foundWords.size >= limit) {
      visited[row][col] = false;
      pathLetters.pop();
      return;
    }
  }

  visited[row][col] = false;
  pathLetters.pop();
}
