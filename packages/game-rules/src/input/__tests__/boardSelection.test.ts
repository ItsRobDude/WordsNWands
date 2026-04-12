import assert from "node:assert/strict";
import test from "node:test";

import {
  applyTapSelectionPosition,
  applyTraceSelectionPayload,
  clearBoardSelectionCandidate,
  commitBoardSelectionCandidate,
  createEmptyBoardSelectionCandidate,
  extendBoardSelectionCandidate,
  startBoardSelectionCandidate,
  type BoardSelectionCandidate,
} from "../boardSelection.ts";

test("tap selection appends adjacent tiles and ignores illegal jumps", () => {
  let candidate = createEmptyBoardSelectionCandidate();

  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 0, col: 0 },
  });
  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 0, col: 1 },
  });
  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 2, col: 2 },
  });

  assert.deepEqual(candidate.selected_positions, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);
});

test("explicit trace-style start and extend reuse the same path semantics", () => {
  let candidate = startBoardSelectionCandidate({ row: 0, col: 0 });

  candidate = extendBoardSelectionCandidate({
    candidate,
    position: { row: 0, col: 1 },
  });
  candidate = extendBoardSelectionCandidate({
    candidate,
    position: { row: 1, col: 1 },
  });
  candidate = extendBoardSelectionCandidate({
    candidate,
    position: { row: 0, col: 1 },
  });

  assert.deepEqual(candidate.selected_positions, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);
});

test("tap selection backtracks on immediate predecessor and no-ops on reused non-tail tile", () => {
  let candidate = createEmptyBoardSelectionCandidate();
  const path = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 1 },
  ];

  for (const position of path) {
    candidate = applyTapSelectionPosition({ candidate, position });
  }

  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 0, col: 1 },
  });

  assert.deepEqual(candidate.selected_positions, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);

  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 0, col: 0 },
  });

  assert.deepEqual(candidate.selected_positions, [{ row: 0, col: 0 }]);

  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 0, col: 0 },
  });

  assert.deepEqual(candidate.selected_positions, [{ row: 0, col: 0 }]);
});

test("commit resets the candidate and returns selected positions", () => {
  let candidate = createEmptyBoardSelectionCandidate();
  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 0, col: 0 },
  });
  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 0, col: 1 },
  });

  const committed = commitBoardSelectionCandidate(candidate);

  assert.deepEqual(committed.committed_selection, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);
  assert.deepEqual(committed.candidate, createEmptyBoardSelectionCandidate());
});

test("trace payload snaps pointer samples into the same selected path semantics", () => {
  const result = applyTraceSelectionPayload({
    candidate: createEmptyBoardSelectionCandidate(),
    payload: {
      trace_id: "trace-1",
      phase: "move",
      samples: [
        { pointer_id: 7, x_px: 12, y_px: 12, t_ms: 2 },
        { pointer_id: 7, x_px: 61, y_px: 12, t_ms: 3 },
      ],
    },
    bounds: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 120,
      board_height_px: 120,
      rows: 2,
      cols: 2,
    },
  });

  assert.deepEqual(result.candidate.selected_positions, []);
  assert.equal(result.committed_selection, null);

  const started = applyTraceSelectionPayload({
    candidate: createEmptyBoardSelectionCandidate(),
    payload: {
      trace_id: "trace-1",
      phase: "start",
      samples: [{ pointer_id: 7, x_px: 12, y_px: 12, t_ms: 1 }],
    },
    bounds: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 120,
      board_height_px: 120,
      rows: 2,
      cols: 2,
    },
  });

  const moved = applyTraceSelectionPayload({
    candidate: started.candidate,
    payload: {
      trace_id: "trace-1",
      phase: "move",
      samples: [{ pointer_id: 7, x_px: 61, y_px: 12, t_ms: 2 }],
    },
    bounds: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 120,
      board_height_px: 120,
      rows: 2,
      cols: 2,
    },
  });

  const ended = applyTraceSelectionPayload({
    candidate: moved.candidate,
    payload: {
      trace_id: "trace-1",
      phase: "end",
      samples: [],
    },
    bounds: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 120,
      board_height_px: 120,
      rows: 2,
      cols: 2,
    },
  });

  assert.deepEqual(ended.committed_selection, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);
  assert.deepEqual(ended.candidate, createEmptyBoardSelectionCandidate());
});

test("trace payload ignores out-of-order timestamps, mismatched pointers, and outside-board samples", () => {
  const started = applyTraceSelectionPayload({
    candidate: createEmptyBoardSelectionCandidate(),
    payload: {
      trace_id: "trace-2",
      phase: "start",
      samples: [{ pointer_id: 1, x_px: 10, y_px: 10, t_ms: 10 }],
    },
    bounds: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 120,
      board_height_px: 120,
      rows: 2,
      cols: 2,
    },
  });

  const moved = applyTraceSelectionPayload({
    candidate: started.candidate,
    payload: {
      trace_id: "trace-2",
      phase: "move",
      samples: [
        { pointer_id: 99, x_px: 70, y_px: 10, t_ms: 11 },
        { pointer_id: 1, x_px: 200, y_px: 200, t_ms: 12 },
        { pointer_id: 1, x_px: 70, y_px: 10, t_ms: 9 },
        { pointer_id: 1, x_px: 70, y_px: 10, t_ms: 13 },
      ],
    },
    bounds: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 120,
      board_height_px: 120,
      rows: 2,
      cols: 2,
    },
  });

  assert.deepEqual(moved.candidate.selected_positions, [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ]);
});

test("blocked or cancelled input clears candidate state without committing", () => {
  let candidate: BoardSelectionCandidate = createEmptyBoardSelectionCandidate();
  candidate = applyTapSelectionPosition({
    candidate,
    position: { row: 1, col: 1 },
  });

  assert.deepEqual(
    clearBoardSelectionCandidate(),
    createEmptyBoardSelectionCandidate(),
  );

  const cancelled = applyTraceSelectionPayload({
    candidate,
    payload: {
      trace_id: "trace-3",
      phase: "cancel",
      samples: [],
    },
    bounds: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 120,
      board_height_px: 120,
      rows: 2,
      cols: 2,
    },
  });

  assert.equal(cancelled.committed_selection, null);
  assert.deepEqual(cancelled.candidate, createEmptyBoardSelectionCandidate());
});
