import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, Text, View } from "react-native";

import type {
  BoardPosition,
  EncounterRuntimeState,
  HeadlessTranscriptEntry,
} from "../../../../../packages/game-rules/src/index.ts";
import type { MobileAppStoreState } from "../store/createMobileAppStore.ts";
import { describeCastResolution } from "../../verticalSlice/formatters.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import { BattleBoard } from "../components/BattleBoard.tsx";
import { SectionCard } from "../components/SectionCard.tsx";
import { StatPill } from "../components/StatPill.tsx";
import { styles } from "../mobileStyles.ts";
import {
  createLocalBoardTouchPointFromNativeEvent,
  resolveBoardPositionFromTileFrames,
  sampleBoardPositionsFromTileFrames,
  type BoardTouchFrame,
  type BoardTouchNativeEvent,
  type TileTouchFrame,
} from "./boardTouch.ts";
import { resolvePauseExitLabel } from "./screenFlow.ts";

export function EncounterScreen(props: {
  active_state: EncounterRuntimeState | null;
  starter_encounter_id: string;
  has_completed_starter_encounter: boolean;
  preview_path_length: number;
  preview_path: MobileAppStoreState["uiSlice"]["swipe_preview_path"];
  preview_word: string;
  starter_hint: string | null;
  last_transcript_entry: HeadlessTranscriptEntry | null;
  pause_overlay_open: boolean;
  on_open_pause_menu: MobileAppStoreState["actions"]["openPauseMenu"];
  on_close_pause_menu: MobileAppStoreState["actions"]["closePauseMenu"];
  on_restart_encounter: MobileAppStoreState["actions"]["restartEncounter"];
  on_leave_encounter: MobileAppStoreState["actions"]["leaveEncounter"];
  on_start_trace_selection: MobileAppStoreState["actions"]["startTraceSelection"];
  on_extend_trace_selection: MobileAppStoreState["actions"]["extendTraceSelection"];
  on_cancel_trace_selection: MobileAppStoreState["actions"]["cancelTraceSelection"];
  on_select_board_position: MobileAppStoreState["actions"]["selectBoardPosition"];
  on_clear_selection: MobileAppStoreState["actions"]["clearSelection"];
  on_submit_selection: MobileAppStoreState["actions"]["submitSelection"];
}): JSX.Element {
  const boardRef = useRef<View | null>(null);
  const lastTracePointRef = useRef<{ x_px: number; y_px: number } | null>(null);
  const traceActiveRef = useRef(false);
  const traceStartPositionRef = useRef<BoardPosition | null>(null);
  const [boardFrame, setBoardFrame] = useState<BoardTouchFrame | null>(null);
  const [pendingTraceStartPosition, setPendingTraceStartPosition] =
    useState<BoardPosition | null>(null);
  const [tileFramesByKey, setTileFramesByKey] = useState<
    Record<string, TileTouchFrame>
  >({});
  const tileFrames = useMemo(
    () => Object.values(tileFramesByKey),
    [tileFramesByKey],
  );
  const displayedPreviewPath = useMemo(
    () =>
      deriveDisplayedPreviewPath({
        preview_path: props.preview_path,
        pending_start_position: pendingTraceStartPosition,
      }),
    [pendingTraceStartPosition, props.preview_path],
  );

  useEffect(() => {
    setTileFramesByKey({});
    setBoardFrame(null);
    setPendingTraceStartPosition(null);
  }, [props.active_state?.encounter_session_id]);

  const boardPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) =>
          resolveStartPosition({
            event: event.nativeEvent,
            board_frame: boardFrame,
            tile_frames: tileFrames,
          }) !== null,
        onStartShouldSetPanResponderCapture: (event) =>
          resolveStartPosition({
            event: event.nativeEvent,
            board_frame: boardFrame,
            tile_frames: tileFrames,
          }) !== null,
        onMoveShouldSetPanResponder: (event, gestureState) => {
          if (tileFrames.length === 0) {
            return false;
          }

          const point = resolveBoardLocalPoint({
            native_event: event.nativeEvent,
            board_frame: boardFrame,
          });
          if (!point) {
            return false;
          }

          const position = resolveBoardPositionFromTileFrames({
            point,
            tile_frames: tileFrames,
          });
          if (!position) {
            return false;
          }

          return Math.hypot(gestureState.dx, gestureState.dy) >= 10;
        },
        onPanResponderGrant: (event) => {
          const startPoint = resolveBoardLocalPoint({
            native_event: event.nativeEvent,
            board_frame: boardFrame,
          });
          const startPosition = resolveStartPosition({
            event: event.nativeEvent,
            board_frame: boardFrame,
            tile_frames: tileFrames,
          });
          if (!startPosition) {
            return;
          }

          traceStartPositionRef.current = startPosition;
          setPendingTraceStartPosition(
            props.preview_path_length === 0 ? startPosition : null,
          );
          lastTracePointRef.current = startPoint;
          traceActiveRef.current = false;
        },
        onPanResponderMove: (event) => {
          const startPosition = traceStartPositionRef.current;
          const lastPoint = lastTracePointRef.current;
          if (!lastPoint || !startPosition || tileFrames.length === 0) {
            return;
          }

          const nextPoint = resolveBoardLocalPoint({
            native_event: event.nativeEvent,
            board_frame: boardFrame,
          });
          if (!nextPoint) {
            return;
          }

          if (!traceActiveRef.current) {
            if (
              Math.hypot(
                nextPoint.x_px - lastPoint.x_px,
                nextPoint.y_px - lastPoint.y_px,
              ) < 10
            ) {
              return;
            }

            props.on_start_trace_selection(startPosition);
            traceActiveRef.current = true;
            setPendingTraceStartPosition(null);
          }

          applyInterpolatedTracePositions({
            from_point: lastPoint,
            to_point: nextPoint,
            tile_frames: tileFrames,
            start_position: startPosition,
            on_extend: props.on_extend_trace_selection,
          });
          lastTracePointRef.current = nextPoint;
        },
        onPanResponderRelease: (event) => {
          const startPosition = traceStartPositionRef.current;
          const lastPoint = lastTracePointRef.current;
          setPendingTraceStartPosition(null);
          if (traceActiveRef.current && lastPoint && tileFrames.length > 0) {
            const nextPoint =
              resolveBoardLocalPoint({
                native_event: event.nativeEvent,
                board_frame: boardFrame,
              }) ?? lastPoint;
            applyInterpolatedTracePositions({
              from_point: lastPoint,
              to_point: nextPoint,
              tile_frames: tileFrames,
              start_position: traceStartPositionRef.current,
              on_extend: props.on_extend_trace_selection,
            });
            void props.on_submit_selection();
          } else if (startPosition) {
            props.on_select_board_position(startPosition);
          }

          traceStartPositionRef.current = null;
          lastTracePointRef.current = null;
          traceActiveRef.current = false;
        },
        onPanResponderTerminate: () => {
          if (traceActiveRef.current) {
            props.on_cancel_trace_selection();
          }
          setPendingTraceStartPosition(null);
          traceStartPositionRef.current = null;
          lastTracePointRef.current = null;
          traceActiveRef.current = false;
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [
      props.on_cancel_trace_selection,
      props.on_extend_trace_selection,
      props.on_select_board_position,
      props.on_start_trace_selection,
      props.preview_path_length,
      props.on_submit_selection,
      boardFrame,
      tileFrames,
    ],
  );

  if (!props.active_state) {
    return (
      <SectionCard eyebrow="Encounter" title="No active encounter">
        <Text style={styles.cardText}>
          Launch an encounter from the starter flow or Home to begin.
        </Text>
      </SectionCard>
    );
  }

  const activeState = props.active_state;
  const currentFeedback = describeCastResolution(props.last_transcript_entry);

  return (
    <View style={styles.encounterScreen}>
      <View style={styles.encounterTopCluster}>
        <View style={styles.utilityRow}>
          <ActionButton
            label="Pause"
            onPress={props.on_open_pause_menu}
            tone="secondary"
          />
        </View>

        <SectionCard
          eyebrow={
            props.active_state.encounter_id === props.starter_encounter_id
              ? "Starter Encounter"
              : "Active Encounter"
          }
          title={props.active_state.creature.display_name}
          accent="cool"
          style={styles.encounterSummaryCard}
          body_style={styles.encounterSummaryBody}
          eyebrow_style={styles.encounterCardEyebrow}
          title_style={styles.encounterCardTitle}
        >
          <View style={styles.statsRowCompact}>
            <StatPill
              label="HP"
              value={`${props.active_state.creature.hp_current}/${props.active_state.creature.hp_max}`}
              compact
            />
            <StatPill
              label="Moves"
              value={`${props.active_state.moves_remaining}/${props.active_state.move_budget_total}`}
              compact
            />
            <StatPill
              label="Countdown"
              value={`${props.active_state.creature.spell_countdown_current}`}
              compact
            />
          </View>
          <Text style={styles.encounterSummaryCopy}>
            Weak to {props.active_state.creature.weakness_element}. Resists{" "}
            {props.active_state.creature.resistance_element}.
          </Text>
        </SectionCard>

        {props.starter_hint ? (
          <View style={styles.encounterHintBanner}>
            <Text style={styles.cardEyebrow}>Guidance</Text>
            <Text style={styles.encounterHintText} numberOfLines={2}>
              {props.starter_hint}
            </Text>
          </View>
        ) : null}
      </View>

      <SectionCard
        eyebrow="Battle Board"
        title="Build a spell path"
        style={styles.encounterBoardCard}
        body_style={styles.encounterBoardBody}
        eyebrow_style={styles.encounterCardEyebrow}
        title_style={styles.encounterCardTitle}
      >
        <Text style={styles.boardCaption}>
          Current preview: {props.preview_word || "none"}
        </Text>
        <View
          ref={(node) => {
            boardRef.current = node;
          }}
          style={styles.board}
          {...boardPanResponder.panHandlers}
          onLayout={(event) => {
            const fallbackFrame = {
              board_left_px: event.nativeEvent.layout.x,
              board_top_px: event.nativeEvent.layout.y,
              board_width_px: event.nativeEvent.layout.width,
              board_height_px: event.nativeEvent.layout.height,
            };
            setBoardFrame(fallbackFrame);
            boardRef.current?.measureInWindow((left, top, width, height) => {
              setBoardFrame({
                board_left_px: left,
                board_top_px: top,
                board_width_px: width || fallbackFrame.board_width_px,
                board_height_px: height || fallbackFrame.board_height_px,
              });
            });
          }}
        >
          <BattleBoard
            state={activeState}
            selected_path={displayedPreviewPath}
            on_tile_layout={(frame) => {
              const key = `${frame.row}:${frame.col}`;
              setTileFramesByKey((current) => {
                const previous = current[key];
                if (
                  previous &&
                  previous.tile_left_px === frame.tile_left_px &&
                  previous.tile_top_px === frame.tile_top_px &&
                  previous.tile_width_px === frame.tile_width_px &&
                  previous.tile_height_px === frame.tile_height_px
                ) {
                  return current;
                }

                return {
                  ...current,
                  [key]: frame,
                };
              });
            }}
          />
        </View>
        <View style={styles.actionsRow}>
          <ActionButton
            label="Clear Path"
            onPress={props.on_clear_selection}
            tone="secondary"
            compact
          />
          <ActionButton
            label="Cast Word"
            onPress={() => {
              void props.on_submit_selection();
            }}
            compact
            disabled={props.preview_path_length === 0}
          />
        </View>
        <Text style={styles.encounterFeedbackText}>
          {currentFeedback ??
            "Tap tiles or trace directly across the letters to cast."}
        </Text>
      </SectionCard>

      {props.pause_overlay_open ? (
        <View style={styles.overlayScrim}>
          <SectionCard eyebrow="Pause" title="Take a breath" accent="cool">
            <Text style={styles.cardText}>
              Your current board and encounter progress stay exactly where they
              are until you return.
            </Text>
            <ActionButton
              label="Resume Encounter"
              onPress={props.on_close_pause_menu}
            />
            <ActionButton
              label="Restart Encounter"
              onPress={() => {
                void props.on_restart_encounter();
              }}
              tone="secondary"
            />
            <ActionButton
              label={resolvePauseExitLabel(
                props.has_completed_starter_encounter,
              )}
              onPress={props.on_leave_encounter}
              tone="ghost"
            />
          </SectionCard>
        </View>
      ) : null}
    </View>
  );
}

function resolveStartPosition(input: {
  event: BoardTouchNativeEvent;
  board_frame: BoardTouchFrame | null;
  tile_frames: readonly TileTouchFrame[];
}): BoardPosition | null {
  const point = resolveBoardLocalPoint({
    native_event: input.event,
    board_frame: input.board_frame,
  });
  if (!point) {
    return null;
  }

  return resolveBoardPositionFromTileFrames({
    point,
    tile_frames: input.tile_frames,
  });
}

function deriveDisplayedPreviewPath(input: {
  preview_path: readonly BoardPosition[];
  pending_start_position: BoardPosition | null;
}): readonly BoardPosition[] {
  if (input.preview_path.length > 0 || !input.pending_start_position) {
    return input.preview_path;
  }

  return [input.pending_start_position];
}

function resolveBoardLocalPoint(input: {
  native_event: BoardTouchNativeEvent;
  board_frame: BoardTouchFrame | null;
}): { x_px: number; y_px: number } | null {
  return createLocalBoardTouchPointFromNativeEvent({
    native_event: input.native_event,
    frame: input.board_frame,
  });
}

function applyInterpolatedTracePositions(input: {
  from_point: { x_px: number; y_px: number };
  to_point: { x_px: number; y_px: number };
  tile_frames: readonly TileTouchFrame[];
  start_position: BoardPosition | null;
  on_extend: MobileAppStoreState["actions"]["extendTraceSelection"];
}) {
  const positions = sampleBoardPositionsFromTileFrames({
    from_point: input.from_point,
    to_point: input.to_point,
    tile_frames: input.tile_frames,
  });

  for (const position of positions) {
    if (
      input.start_position &&
      position.row === input.start_position.row &&
      position.col === input.start_position.col
    ) {
      continue;
    }

    input.on_extend(position);
  }
}
