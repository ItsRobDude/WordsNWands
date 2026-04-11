import type { BoardSnapshot } from "../contracts/board.js";
import type { ApplyTileStatePrimitive } from "../contracts/cast.js";
import { applyNewTileState } from "../board/tileStateLifecycle.ts";

export interface ApplyTileStatePrimitiveContext {
  encounter_seed: string;
  creature_cast_index: number;
  primitive_step_index: number;
}

export const applyTileStatePrimitive = (
  board: BoardSnapshot,
  primitive: ApplyTileStatePrimitive,
  context: ApplyTileStatePrimitiveContext = {
    encounter_seed: "default",
    creature_cast_index: 0,
    primitive_step_index: 0,
  },
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

  const eligible_tiles = board.tiles
    .filter((tile) => tile.state === null)
    .sort((left, right) => compareEligibleTiles(left, right, context));

  if (eligible_tiles.length === 0) {
    return board;
  }

  const selected_ids = new Set(
    eligible_tiles
      .slice(0, Math.min(primitive.target_count, eligible_tiles.length))
      .map((tile) => tile.id),
  );

  return {
    ...board,
    tiles: board.tiles.map((tile) =>
      selected_ids.has(tile.id)
        ? applyNewTileState(tile, primitive.tile_state)
        : tile,
    ),
  };
};

const compareEligibleTiles = (
  left: BoardSnapshot["tiles"][number],
  right: BoardSnapshot["tiles"][number],
  context: ApplyTileStatePrimitiveContext,
): number => {
  const left_rank = stableHash(
    `${context.encounter_seed}:${context.creature_cast_index}:${context.primitive_step_index}:${left.id}`,
  );
  const right_rank = stableHash(
    `${context.encounter_seed}:${context.creature_cast_index}:${context.primitive_step_index}:${right.id}`,
  );

  if (left_rank !== right_rank) {
    return left_rank - right_rank;
  }

  if (left.position.row !== right.position.row) {
    return left.position.row - right.position.row;
  }

  if (left.position.col !== right.position.col) {
    return left.position.col - right.position.col;
  }

  return left.id.localeCompare(right.id);
};

const stableHash = (value: string): number => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};
