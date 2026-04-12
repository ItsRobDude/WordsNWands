import type { BoardPosition } from "../../../../../packages/game-rules/src/index.ts";

export interface TileTouchFrame {
  position: BoardPosition;
  left_px: number;
  top_px: number;
  right_px: number;
  bottom_px: number;
}

export interface TouchPoint {
  x_px: number;
  y_px: number;
}

export interface NativeTouchPoint {
  pageX?: number;
  pageY?: number;
}

export interface EncounterTraceNativeEvent {
  pageX?: number;
  pageY?: number;
  touches?: NativeTouchPoint[];
  changedTouches?: NativeTouchPoint[];
}

export const extractTouchPointFromNativeEvent = (input: {
  native_event: EncounterTraceNativeEvent;
}): TouchPoint | null => {
  const point =
    input.native_event.changedTouches?.[0] ??
    input.native_event.touches?.[0] ??
    input.native_event;

  if (point.pageX === undefined || point.pageY === undefined) {
    return null;
  }

  return {
    x_px: point.pageX,
    y_px: point.pageY,
  };
};

export const findBoardPositionFromFrames = (input: {
  point: TouchPoint;
  tile_frames: readonly TileTouchFrame[];
}): BoardPosition | null => {
  const frame = input.tile_frames.find(
    (candidate) =>
      input.point.x_px >= candidate.left_px &&
      input.point.x_px <= candidate.right_px &&
      input.point.y_px >= candidate.top_px &&
      input.point.y_px <= candidate.bottom_px,
  );

  return frame ? { ...frame.position } : null;
};
