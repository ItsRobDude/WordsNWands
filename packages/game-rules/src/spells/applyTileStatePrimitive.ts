import type { BoardSnapshot } from "../contracts/board.js";
import type { ApplyTileStatePrimitive } from "../contracts/cast.js";

export const applyTileStatePrimitive = (
  board: BoardSnapshot,
  primitive: ApplyTileStatePrimitive,
): BoardSnapshot => {
  if (primitive.target_count < 1) {
    return board;
  }

  if (
    primitive.targeting !== "random_eligible" &&
    primitive.targeting !== "authored_pattern"
  ) {
    return board;
  }

  return board;
};
