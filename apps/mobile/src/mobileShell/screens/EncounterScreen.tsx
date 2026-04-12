import { useRef, useState } from "react";
import { Text, View } from "react-native";

import type {
  EncounterRuntimeState,
  HeadlessTranscriptEntry,
} from "../../../../../packages/game-rules/src/index.ts";
import type {
  CastTracePayload,
  TraceBoardBounds,
} from "../../../../../packages/game-rules/src/input/boardSelection.ts";
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
  type BoardTouchNativeEvent,
  type BoardTouchFrame,
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
  on_apply_trace_selection: MobileAppStoreState["actions"]["applyTraceSelection"];
  on_select_board_position: MobileAppStoreState["actions"]["selectBoardPosition"];
  on_clear_selection: MobileAppStoreState["actions"]["clearSelection"];
  on_submit_selection: MobileAppStoreState["actions"]["submitSelection"];
}): JSX.Element {
  const boardRef = useRef<View | null>(null);
  const pendingTraceStartRef = useRef<ReturnType<
    typeof createTraceSampleFromNativeEvent
  > | null>(null);
  const activeTraceIdRef = useRef<string | null>(null);
  const traceIsActiveRef = useRef(false);
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
            const measuredWidth = event.nativeEvent.layout.width;
            const measuredHeight = event.nativeEvent.layout.height;

            boardRef.current?.measureInWindow((pageX, pageY, width, height) => {
              setBoardFrame({
                board_left_px: pageX,
                board_top_px: pageY,
                board_width_px: width || measuredWidth,
                board_height_px: height || measuredHeight,
              });
            });
          }}
          onTouchStart={(event: unknown) => {
            const sample = createTraceSample(event);
            if (!sample) {
              pendingTraceStartRef.current = null;
              return;
            }

            pendingTraceStartRef.current = sample;
          }}
          onTouchEnd={() => {
            if (!traceIsActiveRef.current) {
              pendingTraceStartRef.current = null;
            }
          }}
          onMoveShouldSetResponder={(event: unknown) => {
            const currentSample = createTraceSample(event);
            if (!currentSample) {
              return false;
            }

            return shouldActivateTraceGesture({
              start_sample: pendingTraceStartRef.current,
              current_sample: currentSample,
            });
          }}
          onResponderGrant={() => {
            const bounds = buildTraceBounds({
              frame: boardFrame,
              active_state: activeState,
            });
            const sample = pendingTraceStartRef.current;
            if (!bounds || !sample) {
              return;
            }

            traceIsActiveRef.current = true;
            activeTraceIdRef.current = `trace-${sample.pointer_id}-${sample.t_ms}`;
            void props.on_apply_trace_selection(
              {
                trace_id: activeTraceIdRef.current,
                phase: "start",
                samples: [sample],
              },
              bounds,
            );
          }}
          onResponderMove={(event: unknown) => {
            const bounds = buildTraceBounds({
              frame: boardFrame,
              active_state: activeState,
            });
            const sample = createTraceSample(event);
            if (!traceIsActiveRef.current || !bounds || !sample) {
              return;
            }

            void props.on_apply_trace_selection(
              {
                trace_id:
                  activeTraceIdRef.current ?? `trace-${sample.pointer_id}`,
                phase: "move",
                samples: [sample],
              },
              bounds,
            );
          }}
          onResponderRelease={(event: unknown) => {
            const bounds = buildTraceBounds({
              frame: boardFrame,
              active_state: activeState,
            });
            const sample = createTraceSample(event);
            if (traceIsActiveRef.current && bounds && sample) {
              void props.on_apply_trace_selection(
                {
                  trace_id:
                    activeTraceIdRef.current ?? `trace-${sample.pointer_id}`,
                  phase: "end",
                  samples: [sample],
                },
                bounds,
              );
            }

            traceIsActiveRef.current = false;
            pendingTraceStartRef.current = null;
            activeTraceIdRef.current = null;
          }}
          onResponderTerminate={() => {
            if (traceIsActiveRef.current) {
              const bounds = buildTraceBounds({
                frame: boardFrame,
                active_state: activeState,
              });
              if (bounds) {
                void props.on_apply_trace_selection(
                  {
                    trace_id: activeTraceIdRef.current ?? "trace-cancelled",
                    phase: "cancel",
                    samples: [],
                  },
                  bounds,
                );
              }
            }

            traceIsActiveRef.current = false;
            pendingTraceStartRef.current = null;
            activeTraceIdRef.current = null;
          }}
        >
          <BattleBoard
            state={activeState}
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

function createTraceSample(event: unknown) {
  const nativeEvent = (
    event as {
      nativeEvent?: BoardTouchNativeEvent;
    }
  ).nativeEvent;

  return createTraceSampleFromNativeEvent({
    native_event: nativeEvent ?? {},
    frame: {
      board_left_px: 0,
      board_top_px: 0,
      board_width_px: 0,
      board_height_px: 0,
    },
  });
}

function buildTraceBounds(input: {
  frame: BoardTouchFrame | null;
  active_state: EncounterRuntimeState;
}): TraceBoardBounds | null {
  if (!input.frame) {
    return null;
  }

  return createTraceBounds({
    frame: input.frame,
    rows: input.active_state.board.height,
    cols: input.active_state.board.width,
  });
}
