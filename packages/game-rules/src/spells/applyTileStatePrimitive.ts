import type { BoardSnapshot } from "../contracts/board.js";
import type { ApplyTileStatePrimitive } from "../contracts/cast.js";

const toPositionKey = (row: number, col: number): string => `${row}:${col}`;

export const applyTileStatePrimitive = (
  board: BoardSnapshot,
  primitive: ApplyTileStatePrimitive,
): BoardSnapshot => {
  if (primitive.target_positions.length === 0) {
    return board;
  }

  const target_position_keys = new Set(
    primitive.target_positions.map((position) =>
      toPositionKey(position.row, position.col),
    ),
  );

  let did_change = false;
  const next_tiles = board.tiles.map((tile) => {
    if (
      !target_position_keys.has(
        toPositionKey(tile.position.row, tile.position.col),
      )
    ) {
      return tile;
    }

    if (tile.state !== null) {
      return tile;
    }

    did_change = true;
    return {
      ...tile,
      state: primitive.tile_state,
    };
  });

  if (!did_change) {
    return board;
  }

  return {
    ...board,
    tiles: next_tiles,
  };
};
