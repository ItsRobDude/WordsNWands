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
  const minLength = input.minimum_length ?? 3;
  const rowCount = input.board.length;
  if (rowCount === 0) return false;

  const colCount = input.board[0]?.length ?? 0;
  if (colCount === 0) return false;

  const maxWordLength = input.validation_lookup.getMaxWordLength();
  if (maxWordLength < minLength) {
    return false;
  }

  const visited: boolean[][] = Array.from({ length: rowCount }, () =>
    Array(colCount).fill(false),
  );

  for (let row = 0; row < rowCount; row += 1) {
    for (let col = 0; col < colCount; col += 1) {
      if (dfs(row, col, [], visited, input, minLength)) {
        return true;
      }
    }
  }

  return false;
}

function dfs(
  row: number,
  col: number,
  pathLetters: string[],
  visited: boolean[][],
  input: HasPlayableWordInput,
  minimumLength: number,
): boolean {
  const tile = input.board[row]?.[col];
  if (!tile || tile.blocked || visited[row][col]) {
    return false;
  }

  visited[row][col] = true;
  pathLetters.push(tile.letter);
  const normalizedWord = normalizeTracedBoardLetters(pathLetters);

  if (!input.validation_lookup.hasPrefix(normalizedWord)) {
    visited[row][col] = false;
    pathLetters.pop();
    return false;
  }

  if (pathLetters.length >= minimumLength) {
    const isRepeated = input.repeated_words.has(normalizedWord);
    if (!isRepeated && input.validation_lookup.hasWord(normalizedWord)) {
      visited[row][col] = false;
      pathLetters.pop();
      return true;
    }
  }

  if (pathLetters.length >= input.validation_lookup.getMaxWordLength()) {
    visited[row][col] = false;
    pathLetters.pop();
    return false;
  }

  for (const [rowOffset, colOffset] of ADJACENCY_DIRECTIONS) {
    if (
      dfs(
        row + rowOffset,
        col + colOffset,
        pathLetters,
        visited,
        input,
        minimumLength,
      )
    ) {
      visited[row][col] = false;
      pathLetters.pop();
      return true;
    }
  }

  visited[row][col] = false;
  pathLetters.pop();
  return false;
}
