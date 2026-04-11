import type { BoardSnapshot } from "../contracts/board.js";

export interface ValidationLookup {
  hasWord: (normalized_word: string) => boolean;
  hasPrefix?: (normalized_prefix: string) => boolean;
}

export interface HasPlayableWordInput {
  board: BoardSnapshot;
  repeated_words: readonly string[];
  validation_lookup: ValidationLookup;
  minimum_length?: number;
}

interface BoardCell {
  letter: string;
  blocked: boolean;
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

export const hasPlayableWord = ({
  board,
  repeated_words,
  validation_lookup,
  minimum_length = 3,
}: HasPlayableWordInput): boolean => {
  if (board.height <= 0 || board.width <= 0 || board.tiles.length === 0) {
    return false;
  }

  const grid = buildBoardGrid(board);
  const repeated_words_set = new Set(repeated_words);
  const visited: boolean[][] = Array.from({ length: board.height }, () =>
    Array(board.width).fill(false),
  );

  for (let row_index = 0; row_index < board.height; row_index += 1) {
    for (let col_index = 0; col_index < board.width; col_index += 1) {
      if (
        dfsHasPlayableWord({
          row_index,
          col_index,
          grid,
          visited,
          traced_letters: [],
          minimum_length,
          repeated_words_set,
          validation_lookup,
        })
      ) {
        return true;
      }
    }
  }

  return false;
};

const buildBoardGrid = (board: BoardSnapshot): (BoardCell | null)[][] => {
  const grid: (BoardCell | null)[][] = Array.from(
    { length: board.height },
    () => Array(board.width).fill(null),
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

interface DfsInput {
  row_index: number;
  col_index: number;
  grid: (BoardCell | null)[][];
  visited: boolean[][];
  traced_letters: string[];
  minimum_length: number;
  repeated_words_set: ReadonlySet<string>;
  validation_lookup: ValidationLookup;
}

const dfsHasPlayableWord = ({
  row_index,
  col_index,
  grid,
  visited,
  traced_letters,
  minimum_length,
  repeated_words_set,
  validation_lookup,
}: DfsInput): boolean => {
  const cell = grid[row_index]?.[col_index];
  if (!cell || cell.blocked || visited[row_index]?.[col_index]) {
    return false;
  }

  visited[row_index][col_index] = true;
  traced_letters.push(cell.letter);

  const normalized_word = normalizeTracedBoardLetters(traced_letters);
  const has_prefix_support = typeof validation_lookup.hasPrefix === "function";
  const can_continue =
    !has_prefix_support ||
    validation_lookup.hasPrefix?.(normalized_word) ||
    traced_letters.length >= minimum_length;

  if (can_continue && traced_letters.length >= minimum_length) {
    const is_repeated = repeated_words_set.has(normalized_word);
    if (!is_repeated && validation_lookup.hasWord(normalized_word)) {
      visited[row_index][col_index] = false;
      traced_letters.pop();
      return true;
    }
  }

  if (can_continue) {
    for (const [row_offset, col_offset] of ADJACENCY_DIRECTIONS) {
      if (
        dfsHasPlayableWord({
          row_index: row_index + row_offset,
          col_index: col_index + col_offset,
          grid,
          visited,
          traced_letters,
          minimum_length,
          repeated_words_set,
          validation_lookup,
        })
      ) {
        visited[row_index][col_index] = false;
        traced_letters.pop();
        return true;
      }
    }
  }

  visited[row_index][col_index] = false;
  traced_letters.pop();
  return false;
};

const normalizeTracedBoardLetters = (
  traced_letters: readonly string[],
): string => traced_letters.join("").trim().toLowerCase();
