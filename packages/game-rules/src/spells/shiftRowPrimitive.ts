import type { BoardSnapshot } from "../contracts/board.js";
import type { ShiftRowPrimitive } from "../contracts/cast.js";

export const shiftRowPrimitive = (
  board: BoardSnapshot,
  primitive: ShiftRowPrimitive,
): BoardSnapshot => {
  if (primitive.mode !== "rotate" || primitive.distance !== 1) {
    return board;
  }

  const row_tiles = board.tiles.filter(
    (tile) => tile.position.row === primitive.row_index,
  );

  if (row_tiles.length <= 1) {
    return board;
  }

  const sorted_row_tiles = [...row_tiles].sort(
    (left, right) => left.position.col - right.position.col,
  );

  const rotated_row_tiles =
    primitive.direction === 1
      ? [
          sorted_row_tiles[sorted_row_tiles.length - 1],
          ...sorted_row_tiles.slice(0, -1),
        ]
      : [...sorted_row_tiles.slice(1), sorted_row_tiles[0]];

  const rotated_by_id = new Map(
    rotated_row_tiles.map((tile, index) => [
      tile.id,
      sorted_row_tiles[index].position,
    ]),
  );

  let did_change = false;
  const next_tiles = board.tiles.map((tile) => {
    const next_position = rotated_by_id.get(tile.id);
    if (!next_position) {
      return tile;
    }

    did_change = true;
    return {
      ...tile,
      position: {
        ...next_position,
      },
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
