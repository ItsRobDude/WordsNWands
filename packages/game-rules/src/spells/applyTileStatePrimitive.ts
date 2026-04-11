import type { BoardSnapshot } from "../contracts/board.js";
import type { ApplyTileStatePrimitive } from "../contracts/cast.js";
import { drawUint32FromStreamState } from "../board/deterministicRng.ts";
import { applyNewTileState } from "../board/tileStateLifecycle.ts";

export interface ApplyTileStatePrimitiveContext {
  encounter_seed: string;
  creature_cast_index: number;
  primitive_step_index: number;
  creature_spell_stream_state: string;
}

export interface ApplyTileStatePrimitiveResult {
  board: BoardSnapshot;
  creature_spell_stream_state: string;
}

export const applyTileStatePrimitive = (
  board: BoardSnapshot,
  primitive: ApplyTileStatePrimitive,
  context: ApplyTileStatePrimitiveContext = {
    encounter_seed: "default",
    creature_cast_index: 0,
    primitive_step_index: 0,
    creature_spell_stream_state: "default::creature_spell::v1::0",
  },
): ApplyTileStatePrimitiveResult => {
  if (primitive.target_count < 1) {
    return {
      board,
      creature_spell_stream_state: context.creature_spell_stream_state,
    };
  }

  if (
    primitive.targeting !== "random_eligible" &&
    primitive.targeting !== "authored_pattern"
  ) {
    return {
      board,
      creature_spell_stream_state: context.creature_spell_stream_state,
    };
  }

  const eligible_tiles = board.tiles.filter((tile) => tile.state === null);

  if (eligible_tiles.length === 0) {
    return {
      board,
      creature_spell_stream_state: context.creature_spell_stream_state,
    };
  }

  const selection = selectTargetIds({
    eligible_tiles,
    primitive,
    context,
  });

  return {
    board: {
      ...board,
      tiles: board.tiles.map((tile) =>
        selection.selected_ids.has(tile.id)
          ? applyNewTileState(tile, primitive.tile_state)
          : tile,
      ),
    },
    creature_spell_stream_state: selection.creature_spell_stream_state,
  };
};

const selectTargetIds = (input: {
  eligible_tiles: BoardSnapshot["tiles"];
  primitive: ApplyTileStatePrimitive;
  context: ApplyTileStatePrimitiveContext;
}): { selected_ids: Set<string>; creature_spell_stream_state: string } => {
  if (input.primitive.targeting === "random_eligible") {
    return selectRandomEligibleTargetIds(input);
  }

  return {
    selected_ids: new Set(
      input.eligible_tiles
        .slice()
        .sort((left, right) => compareStableTileOrder(left, right))
        .slice(0, Math.min(input.primitive.target_count, input.eligible_tiles.length))
        .map((tile) => tile.id),
    ),
    creature_spell_stream_state: input.context.creature_spell_stream_state,
  };
};

const UINT32_RANGE = 0x1_0000_0000;

const selectRandomEligibleTargetIds = (input: {
  eligible_tiles: BoardSnapshot["tiles"];
  primitive: ApplyTileStatePrimitive;
  context: ApplyTileStatePrimitiveContext;
}): { selected_ids: Set<string>; creature_spell_stream_state: string } => {
  const remaining_tiles = input.eligible_tiles
    .slice()
    .sort((left, right) => compareStableTileOrder(left, right));
  const selected_ids = new Set<string>();
  let creature_spell_stream_state = input.context.creature_spell_stream_state;
  const picks_remaining = Math.min(
    input.primitive.target_count,
    remaining_tiles.length,
  );

  for (let index = 0; index < picks_remaining; index += 1) {
    const draw = drawUint32FromStreamState(creature_spell_stream_state);
    creature_spell_stream_state = draw.next_stream_state;
    const random_index = Math.min(
      remaining_tiles.length - 1,
      Math.floor((draw.value / UINT32_RANGE) * remaining_tiles.length),
    );
    const [selected_tile] = remaining_tiles.splice(random_index, 1);
    if (selected_tile) {
      selected_ids.add(selected_tile.id);
    }
  }

  return {
    selected_ids,
    creature_spell_stream_state,
  };
};

const compareStableTileOrder = (
  left: BoardSnapshot["tiles"][number],
  right: BoardSnapshot["tiles"][number],
): number => {
  if (left.position.row !== right.position.row) {
    return left.position.row - right.position.row;
  }

  if (left.position.col !== right.position.col) {
    return left.position.col - right.position.col;
  }

  return left.id.localeCompare(right.id);
};
