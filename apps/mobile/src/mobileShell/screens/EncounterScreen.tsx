import { useRef, useState } from "react";
import { Text, View } from "react-native";

import type {
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
  createTraceBounds,
  createTraceSampleFromNativeEvent,
  shouldActivateTraceGesture,
  type BoardTouchFrame,
  type BoardTouchNativeEvent,
} from "./boardTouch.ts";
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
  on_select_board_position: MobileAppStoreState["actions"]["selectBoardPosition"];
  on_apply_trace_selection: MobileAppStoreState["actions"]["applyTraceSelection"];
  on_clear_selection: MobileAppStoreState["actions"]["clearSelection"];
  on_submit_selection: MobileAppStoreState["actions"]["submitSelection"];
}): JSX.Element {
  const boardRef = useRef<View | null>(null);
  const traceIdRef = useRef<string | null>(null);
  const pendingTraceStartRef = useRef<TraceSample | null>(null);
  const [boardFrame, setBoardFrame] = useState<BoardTouchFrame | null>(null);

  if (!props.active_state) {
    return (
      <SectionCard eyebrow="Encounter" title="No active encounter">
        <Text style={styles.cardText}>
          Launch an encounter from the starter flow or Home to begin.
        </Text>
      </SectionCard>
    );
  }

  const boardBounds = boardFrame
    ? createTraceBounds({
        frame: boardFrame,
        rows: props.active_state.board.height,
        cols: props.active_state.board.width,
      })
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
          ref={boardRef}
          style={styles.board}
          onLayout={() => {
            requestAnimationFrame(() => {
              boardRef.current?.measureInWindow((x, y, width, height) => {
                setBoardFrame({
                  board_left_px: x,
                  board_top_px: y,
                  board_width_px: width,
                  board_height_px: height,
                });
              });
            });
          }}
          onTouchStart={(event: unknown) => {
            if (!boardFrame) {
              pendingTraceStartRef.current = null;
              return;
            }

            pendingTraceStartRef.current = createTraceSample(event, boardFrame);
          }}
          onTouchEnd={() => {
            if (!traceIdRef.current) {
              pendingTraceStartRef.current = null;
            }
          }}
          onMoveShouldSetResponder={(event: unknown) => {
            if (!boardFrame) {
              return false;
            }

            const currentSample = createTraceSample(event, boardFrame);
            if (!currentSample) {
              return false;
            }

            return shouldActivateTraceGesture({
              start_sample: pendingTraceStartRef.current,
              current_sample: currentSample,
            });
          }}
          onResponderGrant={() => {
            if (!boardBounds || !pendingTraceStartRef.current) {
              return;
            }

            const traceId = createTraceId();
            traceIdRef.current = traceId;
            void props.on_apply_trace_selection(
              {
                trace_id: traceId,
                phase: "start",
                samples: [pendingTraceStartRef.current],
              },
              boardBounds,
            );
          }}
          onResponderMove={(event: unknown) => {
            if (!boardBounds || !traceIdRef.current || !boardFrame) {
              return;
            }

            const sample = createTraceSample(event, boardFrame);
            if (!sample) {
              return;
            }

            void props.on_apply_trace_selection(
              {
                trace_id: traceIdRef.current,
                phase: "move",
                samples: [sample],
              },
              boardBounds,
            );
          }}
          onResponderRelease={(event: unknown) => {
            if (!boardBounds || !traceIdRef.current || !boardFrame) {
              pendingTraceStartRef.current = null;
              return;
            }

            const sample = createTraceSample(event, boardFrame);
            void props.on_apply_trace_selection(
              {
                trace_id: traceIdRef.current,
                phase: "end",
                samples: sample ? [sample] : [],
              },
              boardBounds,
            );
            traceIdRef.current = null;
            pendingTraceStartRef.current = null;
          }}
          onResponderTerminate={() => {
            if (!boardBounds || !traceIdRef.current) {
              pendingTraceStartRef.current = null;
              return;
            }

            void props.on_apply_trace_selection(
              {
                trace_id: traceIdRef.current,
                phase: "cancel",
                samples: [],
              },
              boardBounds,
            );
            traceIdRef.current = null;
            pendingTraceStartRef.current = null;
          }}
        >
          <BattleBoard
            state={props.active_state}
            selected_path={props.preview_path}
            on_tile_press={(tile) =>
              props.on_select_board_position(tile.position)
            }
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
          {currentFeedback ?? "Tap tiles or drag across the board to cast."}
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
  boardFrame: BoardTouchFrame,
): TraceSample | null {
  const nativeEvent = (
    event as {
      nativeEvent?: BoardTouchNativeEvent;
    }
  ).nativeEvent;

  return createTraceSampleFromNativeEvent({
    native_event: nativeEvent ?? {},
    frame: boardFrame,
  });
}

function createTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
