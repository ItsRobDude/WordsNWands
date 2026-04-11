import type { BoardSnapshot, BoardTile } from "../contracts/board.js";

export interface CollapseColumnsInput {
  board: BoardSnapshot;
}

export const collapseColumns = ({
  board,
}: CollapseColumnsInput): BoardSnapshot => {
  const tiles_by_column = new Map<number, BoardTile[]>();

  for (const tile of board.tiles) {
    const existing = tiles_by_column.get(tile.position.col) ?? [];
    existing.push(tile);
    tiles_by_column.set(tile.position.col, existing);
  }

  const collapsed_tiles: BoardTile[] = [];

  for (let col = 0; col < board.width; col += 1) {
    const column_tiles = (tiles_by_column.get(col) ?? [])
      .slice()
      .sort((left, right) => left.position.row - right.position.row);

    const starting_row = board.height - column_tiles.length;

    column_tiles.forEach((tile, index) => {
      collapsed_tiles.push({
        ...tile,
        position: {
          row: starting_row + index,
          col,
        },
      });
    });
  }

  return {
    ...board,
    tiles: collapsed_tiles,
  };
};
