import type { BoardPosition } from "../contracts/board.js";

export interface BoardSelectionCandidate {
  selected_positions: BoardPosition[];
  active_trace_id: string | null;
  active_pointer_id: number | null;
  last_trace_timestamp_ms: number | null;
}

export interface TraceBoardBounds {
  board_left_px: number;
  board_top_px: number;
  board_width_px: number;
  board_height_px: number;
  rows: number;
  cols: number;
}

export interface TracePointerSample {
  pointer_id: number;
  x_px: number;
  y_px: number;
  t_ms: number;
}

export interface CastTracePayload {
  trace_id: string;
  phase: "start" | "move" | "end" | "cancel";
  samples: TracePointerSample[];
}

export interface ApplyTraceSelectionResult {
  candidate: BoardSelectionCandidate;
  committed_selection: BoardPosition[] | null;
}

export const createEmptyBoardSelectionCandidate =
  (): BoardSelectionCandidate => ({
    selected_positions: [],
    active_trace_id: null,
    active_pointer_id: null,
    last_trace_timestamp_ms: null,
  });

export const clearBoardSelectionCandidate = (): BoardSelectionCandidate =>
  createEmptyBoardSelectionCandidate();

export const commitBoardSelectionCandidate = (
  candidate: BoardSelectionCandidate,
): ApplyTraceSelectionResult => ({
  candidate: createEmptyBoardSelectionCandidate(),
  committed_selection:
    candidate.selected_positions.length === 0
      ? null
      : clonePositions(candidate.selected_positions),
});

export const applyTapSelectionPosition = (input: {
  candidate: BoardSelectionCandidate;
  position: BoardPosition;
}): BoardSelectionCandidate => ({
  ...createEmptyBoardSelectionCandidate(),
  selected_positions: appendSelectionPosition(
    input.candidate.selected_positions,
    input.position,
  ),
});

export const applyTraceSelectionPayload = (input: {
  candidate: BoardSelectionCandidate;
  payload: CastTracePayload;
  bounds: TraceBoardBounds;
}): ApplyTraceSelectionResult => {
  if (input.payload.phase === "cancel") {
    return {
      candidate: createEmptyBoardSelectionCandidate(),
      committed_selection: null,
    };
  }

  let candidate =
    input.payload.phase === "start"
      ? createEmptyBoardSelectionCandidate()
      : cloneCandidate(input.candidate);

  if (input.payload.phase === "start") {
    candidate.active_trace_id = input.payload.trace_id;
  } else if (candidate.active_trace_id !== input.payload.trace_id) {
    return {
      candidate,
      committed_selection: null,
    };
  }

  for (const sample of input.payload.samples) {
    if (
      candidate.last_trace_timestamp_ms !== null &&
      sample.t_ms < candidate.last_trace_timestamp_ms
    ) {
      continue;
    }

    if (
      candidate.active_pointer_id !== null &&
      sample.pointer_id !== candidate.active_pointer_id
    ) {
      continue;
    }

    if (candidate.active_pointer_id === null) {
      candidate.active_pointer_id = sample.pointer_id;
    }

    candidate.last_trace_timestamp_ms = sample.t_ms;

    const snappedPosition = snapTraceSampleToBoard({
      sample,
      bounds: input.bounds,
    });

    if (!snappedPosition) {
      continue;
    }

    candidate.selected_positions = appendSelectionPosition(
      candidate.selected_positions,
      snappedPosition,
    );
  }

  if (input.payload.phase !== "end") {
    return {
      candidate,
      committed_selection: null,
    };
  }

  return {
    candidate: createEmptyBoardSelectionCandidate(),
    committed_selection:
      candidate.selected_positions.length === 0
        ? null
        : clonePositions(candidate.selected_positions),
  };
};

const appendSelectionPosition = (
  currentPath: readonly BoardPosition[],
  nextPosition: BoardPosition,
): BoardPosition[] => {
  if (currentPath.length === 0) {
    return [clonePosition(nextPosition)];
  }

  const tail = currentPath[currentPath.length - 1];
  if (!tail) {
    return [clonePosition(nextPosition)];
  }

  if (isSamePosition(tail, nextPosition)) {
    return clonePositions(currentPath);
  }

  const predecessor = currentPath[currentPath.length - 2];
  if (predecessor && isSamePosition(predecessor, nextPosition)) {
    return clonePositions(currentPath.slice(0, -1));
  }

  if (!isAdjacent(tail, nextPosition)) {
    return clonePositions(currentPath);
  }

  if (currentPath.some((position) => isSamePosition(position, nextPosition))) {
    return clonePositions(currentPath);
  }

  return [...clonePositions(currentPath), clonePosition(nextPosition)];
};

const snapTraceSampleToBoard = (input: {
  sample: TracePointerSample;
  bounds: TraceBoardBounds;
}): BoardPosition | null => {
  const {
    board_left_px,
    board_top_px,
    board_width_px,
    board_height_px,
    rows,
    cols,
  } = input.bounds;
  const { x_px, y_px } = input.sample;

  if (
    x_px < board_left_px ||
    y_px < board_top_px ||
    x_px >= board_left_px + board_width_px ||
    y_px >= board_top_px + board_height_px
  ) {
    return null;
  }

  const cell_width_px = board_width_px / cols;
  const cell_height_px = board_height_px / rows;

  return {
    col: Math.min(
      cols - 1,
      Math.max(0, Math.floor((x_px - board_left_px) / cell_width_px)),
    ),
    row: Math.min(
      rows - 1,
      Math.max(0, Math.floor((y_px - board_top_px) / cell_height_px)),
    ),
  };
};

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

const cloneCandidate = (
  candidate: BoardSelectionCandidate,
): BoardSelectionCandidate => ({
  selected_positions: clonePositions(candidate.selected_positions),
  active_trace_id: candidate.active_trace_id,
  active_pointer_id: candidate.active_pointer_id,
  last_trace_timestamp_ms: candidate.last_trace_timestamp_ms,
});
