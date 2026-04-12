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

export interface TileTouchFrame {
  tile_left_px: number;
  tile_top_px: number;
  tile_width_px: number;
  tile_height_px: number;
  row: number;
  col: number;
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

export const createPageTouchPointFromNativeEvent = (input: {
  native_event: BoardTouchNativeEvent;
  frame: BoardTouchFrame | null;
}): { x_px: number; y_px: number } | null => {
  const point = resolveBoardTouchPoint(input.native_event);
  if (point.pageX !== undefined && point.pageY !== undefined) {
    return {
      x_px: point.pageX,
      y_px: point.pageY,
    };
  }

  if (
    input.frame &&
    point.locationX !== undefined &&
    point.locationY !== undefined
  ) {
    return {
      x_px: input.frame.board_left_px + point.locationX,
      y_px: input.frame.board_top_px + point.locationY,
    };
  }

  return null;
};

export const resolveBoardPositionFromTileFrames = (input: {
  point: { x_px: number; y_px: number };
  tile_frames: readonly TileTouchFrame[];
  edge_slop_px?: number;
}): { row: number; col: number } | null => {
  const edgeSlopPx = input.edge_slop_px ?? 10;
  let bestMatch: TileTouchFrame | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const tileFrame of input.tile_frames) {
    const insideX =
      input.point.x_px >= tileFrame.tile_left_px - edgeSlopPx &&
      input.point.x_px <=
        tileFrame.tile_left_px + tileFrame.tile_width_px + edgeSlopPx;
    const insideY =
      input.point.y_px >= tileFrame.tile_top_px - edgeSlopPx &&
      input.point.y_px <=
        tileFrame.tile_top_px + tileFrame.tile_height_px + edgeSlopPx;
    if (!insideX || !insideY) {
      continue;
    }

    const centerX = tileFrame.tile_left_px + tileFrame.tile_width_px / 2;
    const centerY = tileFrame.tile_top_px + tileFrame.tile_height_px / 2;
    const distance = Math.hypot(
      input.point.x_px - centerX,
      input.point.y_px - centerY,
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = tileFrame;
    }
  }

  if (!bestMatch) {
    return null;
  }

  return {
    row: bestMatch.row,
    col: bestMatch.col,
  };
};

export const sampleBoardPositionsFromTileFrames = (input: {
  from_point: { x_px: number; y_px: number };
  to_point: { x_px: number; y_px: number };
  tile_frames: readonly TileTouchFrame[];
  step_px?: number;
}): Array<{ row: number; col: number }> => {
  const deltaX = input.to_point.x_px - input.from_point.x_px;
  const deltaY = input.to_point.y_px - input.from_point.y_px;
  const distancePx = Math.hypot(deltaX, deltaY);
  const sampleStepPx = input.step_px ?? 12;
  const sampleCount = Math.max(1, Math.ceil(distancePx / sampleStepPx));
  const positions: Array<{ row: number; col: number }> = [];

  for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
    const interpolation = sampleIndex / sampleCount;
    const point = {
      x_px: input.from_point.x_px + deltaX * interpolation,
      y_px: input.from_point.y_px + deltaY * interpolation,
    };
    const position = resolveBoardPositionFromTileFrames({
      point,
      tile_frames: input.tile_frames,
    });

    if (!position) {
      continue;
    }

    const previous = positions[positions.length - 1];
    if (
      previous &&
      previous.row === position.row &&
      previous.col === position.col
    ) {
      continue;
    }

    positions.push(position);
  }

  return positions;
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
