import type { BoardTile } from "../contracts/board.js";
import type { TileStateKind } from "../contracts/core.js";

const BASE_STATE_TURNS: Record<TileStateKind, number> = {
  frozen: 1,
  sooted: 2,
  dull: 2,
  bubble: 1,
};

export const getBaseStateTurns = (state: TileStateKind): number =>
  BASE_STATE_TURNS[state];

export const getStateTurnsRemaining = (
  tile: Pick<BoardTile, "state" | "state_turns_remaining">,
): number | null => {
  if (tile.state === null) {
    return null;
  }

  return tile.state_turns_remaining ?? getBaseStateTurns(tile.state);
};

export const applyNewTileState = (
  tile: BoardTile,
  state: TileStateKind,
): BoardTile => ({
  ...tile,
  state,
  // Creature spells resolve before the end-of-cast tick, so newly applied
  // states carry one extra turn in storage and lose it during that same tick.
  state_turns_remaining: getBaseStateTurns(state) + 1,
});

export const clearTileState = (tile: BoardTile): BoardTile => ({
  ...tile,
  state: null,
  state_turns_remaining: null,
});
