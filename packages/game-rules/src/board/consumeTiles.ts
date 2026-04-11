import type { BoardSnapshot } from "../contracts/board.js";
import type { CastSubmission } from "../contracts/cast.js";

export interface ConsumeTilesInput {
  board: BoardSnapshot;
  submission: CastSubmission;
}

export const consumeTiles = ({
  board,
  submission,
}: ConsumeTilesInput): BoardSnapshot => {
  const consumed_positions = new Set(
    submission.selected_positions.map(
      (position) => `${position.row}:${position.col}`,
    ),
  );

  return {
    ...board,
    tiles: board.tiles
      .filter(
        (tile) =>
          !consumed_positions.has(`${tile.position.row}:${tile.position.col}`),
      )
      .map((tile) => ({
        ...tile,
        position: { ...tile.position },
      })),
  };
};
