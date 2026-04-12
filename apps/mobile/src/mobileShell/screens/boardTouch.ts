import type {
  TraceBoardBounds,
  TracePointerSample,
} from "../../../../../packages/game-rules/src/input/boardSelection.ts";

export interface BoardTouchFrame {
  board_left_px: number;
  board_top_px: number;
  board_width_px: number;
  board_height_px: number;
}

export interface BoardTouchNativeEvent {
  identifier?: number;
  pageX?: number;
  pageY?: number;
  timestamp?: number;
  touches?: BoardTouchPoint[];
  changedTouches?: BoardTouchPoint[];
}

export interface BoardTouchPoint {
  identifier?: number;
  pageX?: number;
  pageY?: number;
  timestamp?: number;
}

export const createTraceBounds = (input: {
  frame: BoardTouchFrame;
  rows: number;
  cols: number;
}): TraceBoardBounds => ({
  ...input.frame,
  rows: input.rows,
  cols: input.cols,
});

export const createTraceSampleFromNativeEvent = (input: {
  native_event: BoardTouchNativeEvent;
  frame: BoardTouchFrame;
}): TracePointerSample | null => {
  const point = resolveBoardTouchPoint(input.native_event);
  if (point.pageX === undefined || point.pageY === undefined) {
    return null;
  }

  return {
    pointer_id: point.identifier ?? 0,
    x_px: point.pageX,
    y_px: point.pageY,
    t_ms: point.timestamp ?? Date.now(),
  };
};

export const shouldActivateTraceGesture = (input: {
  start_sample: TracePointerSample | null;
  current_sample: TracePointerSample;
  threshold_px?: number;
}): boolean => {
  if (!input.start_sample) {
    return false;
  }

  const thresholdPx = input.threshold_px ?? 10;
  const deltaX = input.current_sample.x_px - input.start_sample.x_px;
  const deltaY = input.current_sample.y_px - input.start_sample.y_px;

  return Math.hypot(deltaX, deltaY) >= thresholdPx;
};

const resolveBoardTouchPoint = (
  nativeEvent: BoardTouchNativeEvent,
): BoardTouchPoint =>
  nativeEvent.changedTouches?.[0] ?? nativeEvent.touches?.[0] ?? nativeEvent;
