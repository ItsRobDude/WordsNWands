import type { BoardSnapshot, BoardTile } from "../contracts/board.js";
import { clearTileState, getStateTurnsRemaining } from "./tileStateLifecycle.ts";

export interface ApplyBubbleRiseInput {
  board: BoardSnapshot;
}

export const applyBubbleRise = ({
  board,
}: ApplyBubbleRiseInput): BoardSnapshot => {
  const next_tiles: BoardTile[] = [];

  for (let col = 0; col < board.width; col += 1) {
    const column_tiles = board.tiles
      .filter((tile) => tile.position.col === col)
      .sort((left, right) => left.position.row - right.position.row);

    const bubble_tiles = column_tiles
      .filter(
        (tile) =>
          tile.state === "bubble" && (getStateTurnsRemaining(tile) ?? 0) <= 1,
      )
      .map((tile) => clearTileState(tile));

    if (bubble_tiles.length === 0) {
      next_tiles.push(...column_tiles);
      continue;
    }

    const non_bubble_tiles = column_tiles.filter(
      (tile) =>
        tile.state !== "bubble" || (getStateTurnsRemaining(tile) ?? 0) > 1,
    );

    [...bubble_tiles, ...non_bubble_tiles].forEach((tile, row) => {
      next_tiles.push({
        ...tile,
        position: {
          row,
          col,
        },
      });
    });
  }

  return {
    ...board,
    tiles: next_tiles,
  };
};
