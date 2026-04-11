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
  target_positions: BoardPosition[];
}

export interface ShiftRowPrimitive {
  kind: "shift_row";
  row_index: number;
  direction: "left" | "right";
}

export interface ShiftColumnPrimitive {
  kind: "shift_column";
  col_index: number;
  direction: "up" | "down";
}

export interface ChainedSpellPrimitive {
  kind: "chained";
  steps: CreatureSpellPrimitive[];
}
