import type { BoardPosition } from "../../../../../packages/game-rules/src/index.ts";
import { appendBoardSelectionPosition } from "../../../../../packages/game-rules/src/input/boardSelection.ts";

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

export interface BoardFrame extends BoardGridLayout {
  board_left_px: number;
  board_top_px: number;
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

export const extractBoardTouchPointFromNativeEvent = (input: {
  native_event: EncounterTraceNativeEvent;
  board_frame: BoardFrame | null;
}): TouchPoint | null => {
  const point =
    input.native_event.changedTouches?.[0] ??
    input.native_event.touches?.[0] ??
    input.native_event;

  if (
    input.board_frame &&
    point.pageX !== undefined &&
    point.pageY !== undefined
  ) {
    return {
      x_px: point.pageX - input.board_frame.board_left_px,
      y_px: point.pageY - input.board_frame.board_top_px,
    };
  }

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
}): BoardPosition[] =>
  appendBoardSelectionPosition(input.current_path, input.next_position);

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
