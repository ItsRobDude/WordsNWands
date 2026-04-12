import type { BoardPosition } from "../../../../../packages/game-rules/src/index.ts";

export interface TouchPoint {
  x_px: number;
  y_px: number;
}

export interface NativeTouchPoint {
  pageX?: number;
  pageY?: number;
  locationX?: number;
  locationY?: number;
}

export interface EncounterTraceNativeEvent {
  pageX?: number;
  pageY?: number;
  locationX?: number;
  locationY?: number;
  touches?: NativeTouchPoint[];
  changedTouches?: NativeTouchPoint[];
}

export interface BoardGridLayout {
  width_px: number;
  height_px: number;
  rows: number;
  cols: number;
}

export const extractLocalTouchPointFromNativeEvent = (input: {
  native_event: EncounterTraceNativeEvent;
}): TouchPoint | null => {
  const point =
    input.native_event.changedTouches?.[0] ??
    input.native_event.touches?.[0] ??
    input.native_event;

  if (point.locationX === undefined || point.locationY === undefined) {
    return null;
  }

  return {
    x_px: point.locationX,
    y_px: point.locationY,
  };
};

export const resolveBoardPositionFromGrid = (input: {
  point: TouchPoint;
  layout: BoardGridLayout;
  edge_slop_px?: number;
}): BoardPosition | null => {
  const edgeSlopPx = input.edge_slop_px ?? 14;
  const widthPx = input.layout.width_px;
  const heightPx = input.layout.height_px;

  if (widthPx <= 0 || heightPx <= 0) {
    return null;
  }

  if (
    input.point.x_px < -edgeSlopPx ||
    input.point.y_px < -edgeSlopPx ||
    input.point.x_px > widthPx + edgeSlopPx ||
    input.point.y_px > heightPx + edgeSlopPx
  ) {
    return null;
  }

  const clampedX = clamp(input.point.x_px, 0, widthPx - 0.001);
  const clampedY = clamp(input.point.y_px, 0, heightPx - 0.001);
  const cellWidthPx = widthPx / input.layout.cols;
  const cellHeightPx = heightPx / input.layout.rows;

  return {
    col: Math.min(
      input.layout.cols - 1,
      Math.max(0, Math.floor(clampedX / cellWidthPx)),
    ),
    row: Math.min(
      input.layout.rows - 1,
      Math.max(0, Math.floor(clampedY / cellHeightPx)),
    ),
  };
};

export const sampleBoardPositionsAlongSegment = (input: {
  from_point: TouchPoint;
  to_point: TouchPoint;
  layout: BoardGridLayout;
}): BoardPosition[] => {
  const cellWidthPx = input.layout.width_px / input.layout.cols;
  const cellHeightPx = input.layout.height_px / input.layout.rows;
  const sampleStepPx = Math.max(6, Math.min(cellWidthPx, cellHeightPx) * 0.35);
  const deltaX = input.to_point.x_px - input.from_point.x_px;
  const deltaY = input.to_point.y_px - input.from_point.y_px;
  const distancePx = Math.hypot(deltaX, deltaY);
  const sampleCount = Math.max(1, Math.ceil(distancePx / sampleStepPx));
  const positions: BoardPosition[] = [];

  for (let sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex += 1) {
    const interpolation = sampleIndex / sampleCount;
    const point = {
      x_px: input.from_point.x_px + deltaX * interpolation,
      y_px: input.from_point.y_px + deltaY * interpolation,
    };
    const position = resolveBoardPositionFromGrid({
      point,
      layout: input.layout,
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

export const appendStableTracePosition = (input: {
  current_path: readonly BoardPosition[];
  next_position: BoardPosition;
}): BoardPosition[] => {
  if (input.current_path.length === 0) {
    return [clonePosition(input.next_position)];
  }

  const tail = input.current_path[input.current_path.length - 1];
  if (!tail) {
    return [clonePosition(input.next_position)];
  }

  if (isSamePosition(tail, input.next_position)) {
    return clonePositions(input.current_path);
  }

  if (!isAdjacent(tail, input.next_position)) {
    return clonePositions(input.current_path);
  }

  if (
    input.current_path.some((position) =>
      isSamePosition(position, input.next_position),
    )
  ) {
    return clonePositions(input.current_path);
  }

  return [
    ...clonePositions(input.current_path),
    clonePosition(input.next_position),
  ];
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const isAdjacent = (left: BoardPosition, right: BoardPosition): boolean => {
  const rowDelta = Math.abs(left.row - right.row);
  const colDelta = Math.abs(left.col - right.col);

  return rowDelta <= 1 && colDelta <= 1 && rowDelta + colDelta > 0;
};

const isSamePosition = (left: BoardPosition, right: BoardPosition): boolean =>
  left.row === right.row && left.col === right.col;

const clonePosition = (position: BoardPosition): BoardPosition => ({
  row: position.row,
  col: position.col,
});

const clonePositions = (positions: readonly BoardPosition[]): BoardPosition[] =>
  positions.map(clonePosition);
