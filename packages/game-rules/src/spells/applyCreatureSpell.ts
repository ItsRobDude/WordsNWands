import type {
  BoardSnapshot,
  EncounterRuntimeState,
} from "../contracts/board.ts";
import type { CreatureSpellPrimitive } from "../contracts/cast.ts";
import { applyTileStatePrimitive } from "./applyTileStatePrimitive.ts";
import { shiftColumnPrimitive } from "./shiftColumnPrimitive.ts";
import { shiftRowPrimitive } from "./shiftRowPrimitive.ts";

export interface ApplyCreatureSpellInput {
  encounter_state: EncounterRuntimeState;
  primitive: CreatureSpellPrimitive;
}

export const applyCreatureSpell = ({
  encounter_state,
  primitive,
}: ApplyCreatureSpellInput): EncounterRuntimeState => ({
  ...encounter_state,
  board: applyPrimitive(encounter_state.board, primitive, {
    encounter_seed: encounter_state.encounter_seed,
    creature_cast_index: encounter_state.casts_resolved_count + 1,
    primitive_step_index: 0,
  }),
});

const applyPrimitive = (
  board: BoardSnapshot,
  primitive: CreatureSpellPrimitive,
  context: {
    encounter_seed: string;
    creature_cast_index: number;
    primitive_step_index: number;
  },
): BoardSnapshot => {
  switch (primitive.kind) {
    case "apply_tile_state":
      return applyTileStatePrimitive(board, primitive, context);
    case "shift_row":
      return shiftRowPrimitive(board, primitive);
    case "shift_column":
      return shiftColumnPrimitive(board, primitive);
    case "chained": {
      let next_board = board;
      primitive.steps.forEach((step, index) => {
        next_board = applyPrimitive(next_board, step, {
          ...context,
          primitive_step_index: context.primitive_step_index + index,
        });
      });
      return next_board;
    }
    default:
      return board;
  }
};
