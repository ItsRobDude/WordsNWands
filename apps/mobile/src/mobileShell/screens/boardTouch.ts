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
  locationX?: number;
  locationY?: number;
  timestamp?: number;
  touches?: BoardTouchPoint[];
  changedTouches?: BoardTouchPoint[];
}

export interface BoardTouchPoint {
  identifier?: number;
  pageX?: number;
  pageY?: number;
  locationX?: number;
  locationY?: number;
  timestamp?: number;
}

export const createTraceBounds = (input: {
  frame: BoardTouchFrame;
  rows: number;
  cols: number;
}): TraceBoardBounds => ({
  board_left_px: 0,
  board_top_px: 0,
  board_width_px: input.frame.board_width_px,
  board_height_px: input.frame.board_height_px,
  rows: input.rows,
  cols: input.cols,
});

export const createTraceSampleFromNativeEvent = (input: {
  native_event: BoardTouchNativeEvent;
  frame: BoardTouchFrame;
}): TracePointerSample | null => {
  const point = resolveBoardTouchPoint(input.native_event);
  const localPoint = resolveLocalBoardTouchPoint({
    point,
    frame: input.frame,
  });
  if (!localPoint) {
    return null;
  }

  return {
    pointer_id: point.identifier ?? 0,
    x_px: localPoint.x_px,
    y_px: localPoint.y_px,
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

const resolveLocalBoardTouchPoint = (input: {
  point: BoardTouchPoint;
  frame: BoardTouchFrame;
}): { x_px: number; y_px: number } | null => {
  if (
    input.point.locationX !== undefined &&
    input.point.locationY !== undefined
  ) {
    return {
      x_px: input.point.locationX,
      y_px: input.point.locationY,
    };
  }

  if (
    input.point.pageX === undefined ||
    input.point.pageY === undefined ||
    input.frame.board_width_px <= 0 ||
    input.frame.board_height_px <= 0
  ) {
    return null;
  }

  return {
    x_px: input.point.pageX - input.frame.board_left_px,
    y_px: input.point.pageY - input.frame.board_top_px,
  };
};
