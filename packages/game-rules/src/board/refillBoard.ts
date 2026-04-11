import type {
  BoardSnapshot,
  EncounterRngStreamStates,
} from "../contracts/board.js";

import {
  drawUint32FromStreamState,
  pickLetterFromDraw,
  withAdvancedBoardFillStream,
} from "./deterministicRng.ts";

const DEFAULT_LETTER_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export interface RefillBoardInput {
  board: BoardSnapshot;
  rng_stream_states: EncounterRngStreamStates;
  letter_pool?: readonly string[];
}

export interface RefillBoardResult {
  board: BoardSnapshot;
  rng_stream_states: EncounterRngStreamStates;
}

export const refillBoard = ({
  board,
  rng_stream_states,
  letter_pool = DEFAULT_LETTER_POOL,
}: RefillBoardInput): RefillBoardResult => {
  const occupied = new Set(
    board.tiles.map((tile) => `${tile.position.row}:${tile.position.col}`),
  );

  const spawned_tiles: BoardSnapshot["tiles"] = [];
  let stream_state = rng_stream_states.board_fill_stream_state;

  for (let col = 0; col < board.width; col += 1) {
    for (let row = 0; row < board.height; row += 1) {
      const key = `${row}:${col}`;
      if (occupied.has(key)) {
        continue;
      }

      const draw = drawUint32FromStreamState(stream_state);
      const letter = pickLetterFromDraw(draw.value, letter_pool);
      stream_state = draw.next_stream_state;

      spawned_tiles.push({
        id: `refill-r${row}-c${col}-${draw.value}`,
        letter,
        position: { row, col },
        state: null,
        state_turns_remaining: null,
        special_marker: null,
      });
    }
  }

  const next_rng_stream_states = withAdvancedBoardFillStream(
    rng_stream_states,
    stream_state,
  );

  return {
    board: {
      ...board,
      tiles: [
        ...board.tiles.map((tile) => ({
          ...tile,
          position: { ...tile.position },
        })),
        ...spawned_tiles,
      ],
      rng_stream_states: next_rng_stream_states,
    },
    rng_stream_states: next_rng_stream_states,
  };
};
