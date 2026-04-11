import type {
  CastRejectionReason,
  CastSubmissionKind,
  ElementType,
  MatchupResult,
  TileStateKind,
} from "./core.js";
import type { BoardPosition } from "./board.js";

export interface CastSubmission {
  selected_positions: BoardPosition[];
  traced_word_display: string;
}

export interface ValidCastResolution {
  submission_kind: Extract<CastSubmissionKind, "valid">;
  normalized_word: string;
  element: ElementType;
  matchup_result: MatchupResult;
  damage_applied: number;
  countdown_after_cast: number;
  countdown_decremented: 0 | 1;
  moves_remaining_after_cast: number;
}

export interface RejectedCastResolution {
  submission_kind: Exclude<CastSubmissionKind, "valid">;
  rejection_reason: CastRejectionReason;
}

export type CastResolution = ValidCastResolution | RejectedCastResolution;

export type CreatureSpellPrimitive =
  | ApplyTileStatePrimitive
  | ShiftRowPrimitive
  | ShiftColumnPrimitive
  | ChainedSpellPrimitive;

export interface ApplyTileStatePrimitive {
  kind: "apply_tile_state";
  tile_state: TileStateKind;
  target_count: number;
  targeting: "random_eligible" | "authored_pattern";
}

export interface ShiftRowPrimitive {
  kind: "shift_row";
  row_index: number;
  mode: "rotate";
  distance: 1;
  direction: 1 | -1;
}

export interface ShiftColumnPrimitive {
  kind: "shift_column";
  col_index: number;
  mode: "rotate";
  distance: 1;
  direction: 1 | -1;
}

export interface ChainedSpellPrimitive {
  kind: "chained";
  steps: Array<
    ApplyTileStatePrimitive | ShiftRowPrimitive | ShiftColumnPrimitive
  >;
}
