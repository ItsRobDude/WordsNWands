import type { BoardSnapshot } from "../contracts/board.js";

export interface CreateAuthoredBoardInput {
  board: Omit<BoardSnapshot, "tiles">;
  layout: readonly (readonly string[])[];
}

export interface CreateAuthoredBoardResult {
  board: BoardSnapshot;
}

export const createAuthoredBoard = ({
  board,
  layout,
}: CreateAuthoredBoardInput): CreateAuthoredBoardResult => {
  if (layout.length !== board.height) {
    throw new Error(
      `Authored board height mismatch. Expected ${board.height} rows but received ${layout.length}.`,
    );
  }

  const tiles: BoardSnapshot["tiles"] = [];

  for (let row = 0; row < board.height; row += 1) {
    const authoredRow = layout[row];
    if (!authoredRow || authoredRow.length !== board.width) {
      throw new Error(
        `Authored board row ${row} must contain exactly ${board.width} columns.`,
      );
    }

    for (let col = 0; col < board.width; col += 1) {
      const rawLetter = authoredRow[col]?.trim().toUpperCase();
      if (!rawLetter || rawLetter.length !== 1 || !/^[A-Z]$/.test(rawLetter)) {
        throw new Error(
          `Authored board letter at (${row}, ${col}) must be a single ASCII letter.`,
        );
      }

      tiles.push({
        id: `authored-r${row}-c${col}-${rawLetter}`,
        letter: rawLetter,
        position: { row, col },
        state: null,
        state_turns_remaining: null,
        special_marker: null,
      });
    }
  }

  return {
    board: {
      ...board,
      tiles,
    },
  };
};
