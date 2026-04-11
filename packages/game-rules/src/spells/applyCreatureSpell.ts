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
  board: applyPrimitive(encounter_state.board, primitive),
});

const applyPrimitive = (
  board: BoardSnapshot,
  primitive: CreatureSpellPrimitive,
): BoardSnapshot => {
  switch (primitive.kind) {
    case "apply_tile_state":
      return applyTileStatePrimitive(board, primitive);
    case "shift_row":
      return shiftRowPrimitive(board, primitive);
    case "shift_column":
      return shiftColumnPrimitive(board, primitive);
    case "chained": {
      let next_board = board;
      for (const step of primitive.steps) {
        next_board = applyPrimitive(next_board, step);
      }
      return next_board;
    }
    default:
      return board;
  }
};
