import type { BoardSnapshot } from "../contracts/board.js";
import type { ShiftColumnPrimitive } from "../contracts/cast.js";

export const shiftColumnPrimitive = (
  board: BoardSnapshot,
  primitive: ShiftColumnPrimitive,
): BoardSnapshot => {
  if (primitive.mode !== "rotate" || primitive.distance !== 1) {
    return board;
  }

  const column_tiles = board.tiles.filter(
    (tile) => tile.position.col === primitive.col_index,
  );

  if (column_tiles.length <= 1) {
    return board;
  }

  const sorted_column_tiles = [...column_tiles].sort(
    (left, right) => left.position.row - right.position.row,
  );

  const rotated_column_tiles =
    primitive.direction === 1
      ? [
          sorted_column_tiles[sorted_column_tiles.length - 1],
          ...sorted_column_tiles.slice(0, -1),
        ]
      : [...sorted_column_tiles.slice(1), sorted_column_tiles[0]];

  const rotated_by_id = new Map(
    rotated_column_tiles.map((tile, index) => [
      tile.id,
      sorted_column_tiles[index].position,
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
