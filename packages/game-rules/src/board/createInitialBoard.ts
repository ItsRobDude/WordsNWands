import type { BoardSnapshot } from "../contracts/board.js";

import {
  drawUint32FromStreamState,
  pickLetterFromDraw,
  withAdvancedBoardFillStream,
} from "./deterministicRng.ts";

const DEFAULT_LETTER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export interface CreateInitialBoardInput {
  board: Omit<BoardSnapshot, "tiles">;
  letter_pool?: readonly string[];
}

export interface CreateInitialBoardResult {
  board: BoardSnapshot;
}

export const createInitialBoard = ({
  board,
  letter_pool = DEFAULT_LETTER_POOL,
}: CreateInitialBoardInput): CreateInitialBoardResult => {
  const tiles: BoardSnapshot["tiles"] = [];
  let stream_state = board.rng_stream_states.board_fill_stream_state;

  for (let row = 0; row < board.height; row += 1) {
    for (let col = 0; col < board.width; col += 1) {
      const draw = drawUint32FromStreamState(stream_state);
      const letter = pickLetterFromDraw(draw.value, letter_pool);
      stream_state = draw.next_stream_state;

      tiles.push({
        id: `init-r${row}-c${col}-${draw.value}`,
        letter,
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
      rng_stream_states: withAdvancedBoardFillStream(
        board.rng_stream_states,
        stream_state,
      ),
    },
  };
};
