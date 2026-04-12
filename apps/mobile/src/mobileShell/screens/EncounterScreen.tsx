import { useRef, useState } from "react";
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
  extractLocalTouchPointFromNativeEvent,
  resolveBoardPositionFromGrid,
  type BoardGridLayout,
  type EncounterTraceNativeEvent,
} from "./encounterTrace.ts";
import { resolvePauseExitLabel } from "./screenFlow.ts";

interface TraceSample {
  pointer_id: number;
  x_px: number;
  y_px: number;
  t_ms: number;
}

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
  on_apply_trace_selection: MobileAppStoreState["actions"]["applyTraceSelection"];
  on_select_board_position: MobileAppStoreState["actions"]["selectBoardPosition"];
  on_clear_selection: MobileAppStoreState["actions"]["clearSelection"];
  on_submit_selection: MobileAppStoreState["actions"]["submitSelection"];
}): JSX.Element {
  const traceIdRef = useRef<string | null>(null);
  const pendingTraceStartRef = useRef<TraceSample | null>(null);
  const [boardLayout, setBoardLayout] = useState<BoardGridLayout | null>(null);

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
  const boardBounds = boardLayout
    ? {
        board_left_px: 0,
        board_top_px: 0,
        board_width_px: boardLayout.width_px,
        board_height_px: boardLayout.height_px,
        rows: boardLayout.rows,
        cols: boardLayout.cols,
      }
    : null;
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
          style={styles.board}
          onLayout={(event) => {
            setBoardLayout((current) => {
              const nextLayout = {
                width_px: event.nativeEvent.layout.width,
                height_px: event.nativeEvent.layout.height,
                rows: activeState.board.height,
                cols: activeState.board.width,
              };

              if (
                current &&
                current.width_px === nextLayout.width_px &&
                current.height_px === nextLayout.height_px &&
                current.rows === nextLayout.rows &&
                current.cols === nextLayout.cols
              ) {
                return current;
              }

              return nextLayout;
            });
          }}
          onStartShouldSetResponder={() => boardBounds !== null}
          onResponderGrant={(event: unknown) => {
            pendingTraceStartRef.current = createTraceSample(
              event,
              boardLayout,
            );
            traceIdRef.current = null;
          }}
          onResponderMove={(event: unknown) => {
            if (!boardBounds) {
              return;
            }

            const startSample = pendingTraceStartRef.current;
            const currentSample = createTraceSample(event, boardLayout);
            if (!startSample || !currentSample) {
              return;
            }

            if (!traceIdRef.current) {
              if (
                !shouldActivateTraceGesture({
                  start_sample: startSample,
                  current_sample: currentSample,
                })
              ) {
                return;
              }

              const traceId = createTraceId();
              traceIdRef.current = traceId;
              void props.on_apply_trace_selection(
                {
                  trace_id: traceId,
                  phase: "start",
                  samples: [startSample],
                },
                boardBounds,
              );
            }

            void props.on_apply_trace_selection(
              {
                trace_id: traceIdRef.current,
                phase: "move",
                samples: [currentSample],
              },
              boardBounds,
            );
          }}
          onResponderRelease={(event: unknown) => {
            const startSample = pendingTraceStartRef.current;
            const currentSample = createTraceSample(event, boardLayout);
            const traceId = traceIdRef.current;
            pendingTraceStartRef.current = null;
            traceIdRef.current = null;

            if (traceId && boardBounds) {
              void props.on_apply_trace_selection(
                {
                  trace_id: traceId,
                  phase: "end",
                  samples: currentSample ? [currentSample] : [],
                },
                boardBounds,
              );
              return;
            }

            const tapPosition = resolveTapPosition({
              sample: currentSample ?? startSample,
              board_layout: boardLayout,
            });
            if (tapPosition) {
              props.on_select_board_position(tapPosition);
            }
          }}
          onResponderTerminate={() => {
            if (traceIdRef.current && boardBounds) {
              void props.on_apply_trace_selection(
                {
                  trace_id: traceIdRef.current,
                  phase: "cancel",
                  samples: [],
                },
                boardBounds,
              );
            }

            traceIdRef.current = null;
            pendingTraceStartRef.current = null;
          }}
        >
          <BattleBoard state={activeState} selected_path={props.preview_path} />
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

function createTraceSample(
  event: unknown,
  boardLayout: BoardGridLayout | null,
): TraceSample | null {
  if (!boardLayout) {
    return null;
  }

  const nativeEvent = (
    event as {
      nativeEvent?: EncounterTraceNativeEvent & {
        identifier?: number | string;
        timestamp?: number;
      };
    }
  ).nativeEvent;
  const point = extractLocalTouchPointFromNativeEvent({
    native_event: nativeEvent ?? {},
  });
  if (!point) {
    return null;
  }

  return {
    pointer_id:
      typeof nativeEvent?.identifier === "number" ? nativeEvent.identifier : 0,
    x_px: point.x_px,
    y_px: point.y_px,
    t_ms: nativeEvent?.timestamp ?? Date.now(),
  };
}

function resolveTapPosition(input: {
  sample: TraceSample | null;
  board_layout: BoardGridLayout | null;
}): BoardPosition | null {
  if (!input.sample || !input.board_layout) {
    return null;
  }

  return resolveBoardPositionFromGrid({
    point: {
      x_px: input.sample.x_px,
      y_px: input.sample.y_px,
    },
    layout: input.board_layout,
  });
}

function shouldActivateTraceGesture(input: {
  start_sample: TraceSample | null;
  current_sample: TraceSample;
  threshold_px?: number;
}): boolean {
  if (!input.start_sample) {
    return false;
  }

  const thresholdPx = input.threshold_px ?? 10;
  const deltaX = input.current_sample.x_px - input.start_sample.x_px;
  const deltaY = input.current_sample.y_px - input.start_sample.y_px;

  return Math.hypot(deltaX, deltaY) >= thresholdPx;
}

function createTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
