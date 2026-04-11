import type { BoardSnapshot } from "../contracts/board.js";
import {
  clearTileState,
  getStateTurnsRemaining,
} from "./tileStateLifecycle.ts";

export interface TickSurvivingTileStatesInput {
  board: BoardSnapshot;
}

export const tickSurvivingTileStates = ({
  board,
}: TickSurvivingTileStatesInput): BoardSnapshot => ({
  ...board,
  tiles: board.tiles.map((tile) => {
    if (tile.state === null) {
      return tile;
    }

    const turns_remaining = getStateTurnsRemaining(tile);
    if (turns_remaining === null) {
      return tile;
    }

    const next_turns_remaining = Math.max(0, turns_remaining - 1);
    if (next_turns_remaining === 0) {
      return clearTileState(tile);
    }

    return {
      ...tile,
      state_turns_remaining: next_turns_remaining,
    };
  }),
});
