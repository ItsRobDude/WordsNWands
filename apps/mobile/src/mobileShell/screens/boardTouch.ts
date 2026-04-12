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
  identifier?: number | string;
  pageX?: number;
  pageY?: number;
  locationX?: number;
  locationY?: number;
  timestamp?: number;
  touches?: BoardTouchPoint[];
  changedTouches?: BoardTouchPoint[];
}

export interface BoardTouchPoint {
  identifier?: number | string;
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
  const localPoint = createLocalBoardTouchPointFromNativeEvent({
    native_event: input.native_event,
    frame: input.frame,
  });
  if (!localPoint) {
    return null;
  }

  return {
    pointer_id: typeof point.identifier === "number" ? point.identifier : 0,
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

export const createLocalBoardTouchPointFromNativeEvent = (input: {
  native_event: BoardTouchNativeEvent;
  frame: BoardTouchFrame | null;
}): { x_px: number; y_px: number } | null => {
  const point = resolveBoardTouchPoint(input.native_event);

  if (point.locationX !== undefined && point.locationY !== undefined) {
    return {
      x_px: point.locationX,
      y_px: point.locationY,
    };
  }

  if (
    !input.frame ||
    input.frame.board_width_px <= 0 ||
    input.frame.board_height_px <= 0 ||
    point.pageX === undefined ||
    point.pageY === undefined
  ) {
    return null;
  }

  return {
    x_px: point.pageX - input.frame.board_left_px,
    y_px: point.pageY - input.frame.board_top_px,
  };
};

export const resolveBoardPositionFromTileFrames = (input: {
  point: { x_px: number; y_px: number };
  tile_frames: readonly TileTouchFrame[];
  edge_slop_px?: number;
}): { row: number; col: number } | null => {
  const edgeSlopPx = input.edge_slop_px ?? 10;
  const exactMatch = selectClosestTileFrame({
    point: input.point,
    tile_frames: input.tile_frames,
    edge_slop_px: 0,
  });
  const bestMatch =
    exactMatch ??
    (edgeSlopPx > 0
      ? selectClosestTileFrame({
          point: input.point,
          tile_frames: input.tile_frames,
          edge_slop_px: edgeSlopPx,
        })
      : null);

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

const selectClosestTileFrame = (input: {
  point: { x_px: number; y_px: number };
  tile_frames: readonly TileTouchFrame[];
  edge_slop_px: number;
}): TileTouchFrame | null => {
  let bestMatch: TileTouchFrame | null = null;
  let bestRectDistance = Number.POSITIVE_INFINITY;
  let bestCenterDistance = Number.POSITIVE_INFINITY;

  for (const tileFrame of input.tile_frames) {
    if (
      !isPointWithinExpandedTileFrame({
        point: input.point,
        tile_frame: tileFrame,
        edge_slop_px: input.edge_slop_px,
      })
    ) {
      continue;
    }

    const rectDistance = distanceFromPointToTileFrame({
      point: input.point,
      tile_frame: tileFrame,
    });
    const centerDistance = distanceFromPointToTileCenter({
      point: input.point,
      tile_frame: tileFrame,
    });

    if (
      rectDistance < bestRectDistance ||
      (rectDistance === bestRectDistance && centerDistance < bestCenterDistance)
    ) {
      bestMatch = tileFrame;
      bestRectDistance = rectDistance;
      bestCenterDistance = centerDistance;
    }
  }

  return bestMatch;
};

const isPointWithinExpandedTileFrame = (input: {
  point: { x_px: number; y_px: number };
  tile_frame: TileTouchFrame;
  edge_slop_px: number;
}): boolean =>
  input.point.x_px >= input.tile_frame.tile_left_px - input.edge_slop_px &&
  input.point.x_px <=
    input.tile_frame.tile_left_px +
      input.tile_frame.tile_width_px +
      input.edge_slop_px &&
  input.point.y_px >= input.tile_frame.tile_top_px - input.edge_slop_px &&
  input.point.y_px <=
    input.tile_frame.tile_top_px +
      input.tile_frame.tile_height_px +
      input.edge_slop_px;

const distanceFromPointToTileFrame = (input: {
  point: { x_px: number; y_px: number };
  tile_frame: TileTouchFrame;
}): number => {
  const dx = Math.max(
    input.tile_frame.tile_left_px - input.point.x_px,
    0,
    input.point.x_px -
      (input.tile_frame.tile_left_px + input.tile_frame.tile_width_px),
  );
  const dy = Math.max(
    input.tile_frame.tile_top_px - input.point.y_px,
    0,
    input.point.y_px -
      (input.tile_frame.tile_top_px + input.tile_frame.tile_height_px),
  );

  return Math.hypot(dx, dy);
};

const distanceFromPointToTileCenter = (input: {
  point: { x_px: number; y_px: number };
  tile_frame: TileTouchFrame;
}): number => {
  const centerX =
    input.tile_frame.tile_left_px + input.tile_frame.tile_width_px / 2;
  const centerY =
    input.tile_frame.tile_top_px + input.tile_frame.tile_height_px / 2;

  return Math.hypot(input.point.x_px - centerX, input.point.y_px - centerY);
};
