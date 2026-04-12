import { useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";

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
  createPageTouchPointFromNativeEvent,
  resolveBoardPositionFromTileFrames,
  sampleBoardPositionsFromTileFrames,
  shouldActivateTraceGesture,
  type BoardTouchNativeEvent,
  type BoardTouchFrame,
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
  const pendingTraceStartRef = useRef<{
    point: { x_px: number; y_px: number };
    position: BoardPosition;
    latest_point: { x_px: number; y_px: number };
  } | null>(null);
  const lastTracePointRef = useRef<{ x_px: number; y_px: number } | null>(null);
  const traceIsActiveRef = useRef(false);
  const [boardFrame, setBoardFrame] = useState<BoardTouchFrame | null>(null);
  const [tileFramesByKey, setTileFramesByKey] = useState<
    Record<string, TileTouchFrame>
  >({});
  const tileFrames = useMemo(
    () => Object.values(tileFramesByKey),
    [tileFramesByKey],
  );

  useEffect(() => {
    setTileFramesByKey({});
  }, [props.active_state?.encounter_session_id]);

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
          onLayout={(event) => {
            const fallbackFrame = {
              board_left_px: 0,
              board_top_px: 0,
              board_width_px: event.nativeEvent.layout.width,
              board_height_px: event.nativeEvent.layout.height,
            };
            setBoardFrame(fallbackFrame);
            boardRef.current?.measureInWindow((left, top, width, height) => {
              setBoardFrame({
                board_left_px: left,
                board_top_px: top,
                board_width_px: width,
                board_height_px: height,
              });
            });
          }}
          onTouchStart={(event: unknown) => {
            const point = createPagePoint(event, boardFrame);
            if (!point || tileFrames.length === 0) {
              pendingTraceStartRef.current = null;
              return;
            }

            const position = resolveBoardPositionFromTileFrames({
              point,
              tile_frames: tileFrames,
            });
            if (!position) {
              pendingTraceStartRef.current = null;
              return;
            }

            pendingTraceStartRef.current = {
              point,
              position,
              latest_point: point,
            };
          }}
          onTouchEnd={() => {
            if (!traceIsActiveRef.current) {
              pendingTraceStartRef.current = null;
            }
          }}
          onMoveShouldSetResponder={(event: unknown) => {
            const pendingStart = pendingTraceStartRef.current;
            const currentPoint = createPagePoint(event, boardFrame);
            if (!pendingStart || !currentPoint) {
              return false;
            }

            pendingStart.latest_point = currentPoint;
            return shouldActivateTraceGesture({
              start_sample: {
                pointer_id: 0,
                x_px: pendingStart.point.x_px,
                y_px: pendingStart.point.y_px,
                t_ms: 0,
              },
              current_sample: {
                pointer_id: 0,
                x_px: currentPoint.x_px,
                y_px: currentPoint.y_px,
                t_ms: 0,
              },
            });
          }}
          onResponderGrant={() => {
            const pendingStart = pendingTraceStartRef.current;
            if (!pendingStart || tileFrames.length === 0) {
              return;
            }

            traceIsActiveRef.current = true;
            lastTracePointRef.current = pendingStart.point;

            props.on_start_trace_selection(pendingStart.position);
            applyInterpolatedTracePositions({
              from_point: pendingStart.point,
              to_point: pendingStart.latest_point,
              tile_frames: tileFrames,
              start_position: pendingStart.position,
              on_extend: props.on_extend_trace_selection,
            });
            lastTracePointRef.current = pendingStart.latest_point;
          }}
          onResponderMove={(event: unknown) => {
            const currentPoint = createPagePoint(event, boardFrame);
            const lastPoint = lastTracePointRef.current;
            if (
              !traceIsActiveRef.current ||
              !currentPoint ||
              !lastPoint ||
              tileFrames.length === 0
            ) {
              return;
            }

            applyInterpolatedTracePositions({
              from_point: lastPoint,
              to_point: currentPoint,
              tile_frames: tileFrames,
              start_position: null,
              on_extend: props.on_extend_trace_selection,
            });
            lastTracePointRef.current = currentPoint;
          }}
          onResponderRelease={(event: unknown) => {
            const currentPoint = createPagePoint(event, boardFrame);
            const lastPoint = lastTracePointRef.current;
            if (
              traceIsActiveRef.current &&
              currentPoint &&
              lastPoint &&
              tileFrames.length > 0
            ) {
              applyInterpolatedTracePositions({
                from_point: lastPoint,
                to_point: currentPoint,
                tile_frames: tileFrames,
                start_position: null,
                on_extend: props.on_extend_trace_selection,
              });
              lastTracePointRef.current = currentPoint;
              void props.on_submit_selection();
            }

            traceIsActiveRef.current = false;
            pendingTraceStartRef.current = null;
            lastTracePointRef.current = null;
          }}
          onResponderTerminate={() => {
            if (traceIsActiveRef.current) {
              props.on_cancel_trace_selection();
            }

            traceIsActiveRef.current = false;
            pendingTraceStartRef.current = null;
            lastTracePointRef.current = null;
          }}
        >
          <BattleBoard
            state={activeState}
            selected_path={props.preview_path}
            on_tile_press={(tile) =>
              props.on_select_board_position(tile.position)
            }
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

function createPagePoint(event: unknown, boardFrame: BoardTouchFrame | null) {
  const nativeEvent = (
    event as {
      nativeEvent?: BoardTouchNativeEvent;
    }
  ).nativeEvent;

  return createPageTouchPointFromNativeEvent({
    native_event: nativeEvent ?? {},
    frame: boardFrame,
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
