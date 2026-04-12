import assert from "node:assert/strict";
import test from "node:test";

import {
  extractTouchPointFromNativeEvent,
  findBoardPositionFromFrames,
} from "./encounterTrace.ts";

test("extractTouchPointFromNativeEvent prefers changed touches", () => {
  const point = extractTouchPointFromNativeEvent({
    native_event: {
      changedTouches: [{ pageX: 210, pageY: 420 }],
    },
  });

  assert.deepEqual(point, {
    x_px: 210,
    y_px: 420,
  });
});

test("findBoardPositionFromFrames resolves the touched tile frame", () => {
  const position = findBoardPositionFromFrames({
    point: {
      x_px: 250,
      y_px: 430,
    },
    tile_frames: [
      {
        position: { row: 0, col: 0 },
        left_px: 10,
        top_px: 10,
        right_px: 60,
        bottom_px: 60,
      },
      {
        position: { row: 5, col: 4 },
        left_px: 220,
        top_px: 400,
        right_px: 280,
        bottom_px: 460,
      },
    ],
  });

  assert.deepEqual(position, { row: 5, col: 4 });
});

test("findBoardPositionFromFrames returns null outside all tile frames", () => {
  const position = findBoardPositionFromFrames({
    point: {
      x_px: 500,
      y_px: 500,
    },
    tile_frames: [
      {
        position: { row: 0, col: 0 },
        left_px: 10,
        top_px: 10,
        right_px: 60,
        bottom_px: 60,
      },
    ],
  });

  assert.equal(position, null);
});
