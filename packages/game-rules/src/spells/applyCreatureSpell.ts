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
}: ApplyCreatureSpellInput): EncounterRuntimeState => {
  const result = applyPrimitive(encounter_state.board, primitive, {
    encounter_seed: encounter_state.encounter_seed,
    creature_cast_index: encounter_state.casts_resolved_count + 1,
    primitive_step_index: 0,
    creature_spell_stream_state:
      encounter_state.board.rng_stream_states.creature_spell_stream_state,
  });

  return {
    ...encounter_state,
    board: {
      ...result.board,
      rng_stream_states: {
        ...result.board.rng_stream_states,
        creature_spell_stream_state: result.creature_spell_stream_state,
      },
    },
  };
};

const applyPrimitive = (
  board: BoardSnapshot,
  primitive: CreatureSpellPrimitive,
  context: {
    encounter_seed: string;
    creature_cast_index: number;
    primitive_step_index: number;
    creature_spell_stream_state: string;
  },
): {
  board: BoardSnapshot;
  creature_spell_stream_state: string;
} => {
  switch (primitive.kind) {
    case "apply_tile_state":
      return applyTileStatePrimitive(board, primitive, context);
    case "shift_row":
      return {
        board: shiftRowPrimitive(board, primitive),
        creature_spell_stream_state: context.creature_spell_stream_state,
      };
    case "shift_column":
      return {
        board: shiftColumnPrimitive(board, primitive),
        creature_spell_stream_state: context.creature_spell_stream_state,
      };
    case "chained": {
      let next_result = {
        board,
        creature_spell_stream_state: context.creature_spell_stream_state,
      };
      primitive.steps.forEach((step, index) => {
        next_result = applyPrimitive(next_result.board, step, {
          ...context,
          primitive_step_index: context.primitive_step_index + index,
          creature_spell_stream_state: next_result.creature_spell_stream_state,
        });
      });
      return next_result;
    }
    default:
      return {
        board,
        creature_spell_stream_state: context.creature_spell_stream_state,
      };
  }
};
