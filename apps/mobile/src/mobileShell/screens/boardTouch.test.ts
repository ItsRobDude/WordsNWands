import test from "node:test";
import assert from "node:assert/strict";

import {
  createTraceBounds,
  createTraceSampleFromNativeEvent,
  shouldActivateTraceGesture,
  type BoardTouchFrame,
} from "./boardTouch.ts";

const frame: BoardTouchFrame = {
  board_left_px: 40,
  board_top_px: 120,
  board_width_px: 300,
  board_height_px: 300,
};

test("createTraceSampleFromNativeEvent prefers board-local coordinates when available", () => {
  const sample = createTraceSampleFromNativeEvent({
    native_event: {
      identifier: 7,
      locationX: 210,
      locationY: 270,
      pageX: 310,
      pageY: 390,
      timestamp: 1234,
    },
    frame,
  });

  assert.deepEqual(sample, {
    pointer_id: 7,
    x_px: 210,
    y_px: 270,
    t_ms: 1234,
  });
});

test("createTraceSampleFromNativeEvent falls back to frame-adjusted page coordinates", () => {
  const sample = createTraceSampleFromNativeEvent({
    native_event: {
      changedTouches: [
        {
          identifier: 11,
          pageX: 275,
          pageY: 405,
          timestamp: 4321,
        },
      ],
    },
    frame,
  });

  assert.deepEqual(sample, {
    pointer_id: 11,
    x_px: 235,
    y_px: 285,
    t_ms: 4321,
  });
});

test("createTraceSampleFromNativeEvent returns null without usable coordinates", () => {
  const sample = createTraceSampleFromNativeEvent({
    native_event: {
      identifier: 9,
    },
    frame,
  });

  assert.equal(sample, null);
});

test("shouldActivateTraceGesture ignores tiny movement but accepts a real swipe", () => {
  const startSample = createTraceSampleFromNativeEvent({
    native_event: {
      pageX: 100,
      pageY: 200,
      timestamp: 1000,
    },
    frame,
  });
  const tinyMove = createTraceSampleFromNativeEvent({
    native_event: {
      pageX: 105,
      pageY: 204,
      timestamp: 1010,
    },
    frame,
  });
  const swipeMove = createTraceSampleFromNativeEvent({
    native_event: {
      pageX: 124,
      pageY: 216,
      timestamp: 1020,
    },
    frame,
  });

  assert.ok(startSample);
  assert.ok(tinyMove);
  assert.ok(swipeMove);

  assert.equal(
    shouldActivateTraceGesture({
      start_sample: startSample,
      current_sample: tinyMove,
      threshold_px: 10,
    }),
    false,
  );
  assert.equal(
    shouldActivateTraceGesture({
      start_sample: startSample,
      current_sample: swipeMove,
      threshold_px: 10,
    }),
    true,
  );
});

test("createTraceBounds preserves measured board frame and grid shape", () => {
  assert.deepEqual(
    createTraceBounds({
      frame,
      rows: 6,
      cols: 6,
    }),
    {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 300,
      board_height_px: 300,
      rows: 6,
      cols: 6,
    },
  );
});
