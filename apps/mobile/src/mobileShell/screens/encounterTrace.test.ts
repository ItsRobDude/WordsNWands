import assert from "node:assert/strict";
import test from "node:test";

import {
  appendStableTracePosition,
  extractLocalTouchPointFromNativeEvent,
  resolveBoardPositionFromGrid,
  sampleBoardPositionsAlongSegment,
} from "./encounterTrace.ts";

test("extractLocalTouchPointFromNativeEvent prefers changed touches", () => {
  const point = extractLocalTouchPointFromNativeEvent({
    native_event: {
      changedTouches: [{ locationX: 210, locationY: 420 }],
      locationX: 1,
      locationY: 2,
    },
  });

  assert.deepEqual(point, {
    x_px: 210,
    y_px: 420,
  });
});

test("resolveBoardPositionFromGrid maps local board coordinates to row and col", () => {
  const position = resolveBoardPositionFromGrid({
    point: {
      x_px: 250,
      y_px: 430,
    },
    layout: {
      width_px: 300,
      height_px: 600,
      rows: 6,
      cols: 6,
    },
  });

  assert.deepEqual(position, { row: 4, col: 5 });
});

test("resolveBoardPositionFromGrid allows a small edge slop instead of dropping the trace", () => {
  const position = resolveBoardPositionFromGrid({
    point: {
      x_px: -6,
      y_px: 50,
    },
    layout: {
      width_px: 300,
      height_px: 300,
      rows: 6,
      cols: 6,
    },
  });

  assert.deepEqual(position, { row: 1, col: 0 });
});

test("sampleBoardPositionsAlongSegment interpolates through skipped cells", () => {
  const positions = sampleBoardPositionsAlongSegment({
    from_point: {
      x_px: 10,
      y_px: 10,
    },
    to_point: {
      x_px: 290,
      y_px: 10,
    },
    layout: {
      width_px: 300,
      height_px: 300,
      rows: 6,
      cols: 6,
    },
  });

  assert.deepEqual(positions, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
    { row: 0, col: 3 },
    { row: 0, col: 4 },
    { row: 0, col: 5 },
  ]);
});

test("appendStableTracePosition mirrors shared selection backtracking rules", () => {
  let path = appendStableTracePosition({
    current_path: [],
    next_position: { row: 0, col: 0 },
  });

  path = appendStableTracePosition({
    current_path: path,
    next_position: { row: 0, col: 1 },
  });
  path = appendStableTracePosition({
    current_path: path,
    next_position: { row: 0, col: 2 },
  });
  path = appendStableTracePosition({
    current_path: path,
    next_position: { row: 0, col: 1 },
  });

  assert.deepEqual(path, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);
});

test("appendStableTracePosition rejects reused non-tail tiles and non-adjacent jumps", () => {
  let path = appendStableTracePosition({
    current_path: [{ row: 0, col: 0 }],
    next_position: { row: 1, col: 1 },
  });

  path = appendStableTracePosition({
    current_path: path,
    next_position: { row: 0, col: 0 },
  });
  path = appendStableTracePosition({
    current_path: path,
    next_position: { row: 3, col: 3 },
  });

  assert.deepEqual(path, [{ row: 0, col: 0 }]);
});
