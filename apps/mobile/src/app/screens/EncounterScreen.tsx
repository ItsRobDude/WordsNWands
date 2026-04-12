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
import { resolvePauseExitLabel } from "./screenFlow.ts";

interface BoardLayout {
  width: number;
  height: number;
}

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
  const traceIdRef = useRef<string | null>(null);
  const pendingTraceStartRef = useRef<TraceSample | null>(null);
  const [boardLayout, setBoardLayout] = useState<BoardLayout | null>(null);

  if (!props.active_state) {
    return (
      <SectionCard eyebrow="Encounter" title="No active encounter">
        <Text style={styles.cardText}>
          Launch an encounter from the starter flow or Home to begin.
        </Text>
      </SectionCard>
    );
  }

  const boardBounds = boardLayout
    ? {
        board_left_px: 0,
        board_top_px: 0,
        board_width_px: boardLayout.width,
        board_height_px: boardLayout.height,
        rows: props.active_state.board.height,
        cols: props.active_state.board.width,
      }
    : null;
  const currentFeedback = describeCastResolution(props.last_transcript_entry);

  return (
    <View style={styles.encounterScreen}>
      <View style={styles.stack}>
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
        >
          <View style={styles.statsRow}>
            <StatPill
              label="HP"
              value={`${props.active_state.creature.hp_current}/${props.active_state.creature.hp_max}`}
            />
            <StatPill
              label="Moves"
              value={`${props.active_state.moves_remaining}/${props.active_state.move_budget_total}`}
            />
            <StatPill
              label="Countdown"
              value={`${props.active_state.creature.spell_countdown_current}`}
            />
          </View>
          <Text style={styles.cardTextMuted}>
            Weak to {props.active_state.creature.weakness_element}. Resists{" "}
            {props.active_state.creature.resistance_element}.
          </Text>
        </SectionCard>

        {props.starter_hint ? (
          <SectionCard eyebrow="Guidance" title="Current cue">
            <Text style={styles.cardText}>{props.starter_hint}</Text>
          </SectionCard>
        ) : null}

        <SectionCard eyebrow="Board" title="Build a spell path">
          <Text style={styles.cardTextMuted}>
            Current preview: {props.preview_word || "none"}
          </Text>
          <View
            style={styles.board}
            onLayout={(event: unknown) => {
              const layout = (
                event as {
                  nativeEvent?: {
                    layout?: {
                      width: number;
                      height: number;
                    };
                  };
                }
              ).nativeEvent?.layout;
              if (!layout) {
                return;
              }

              setBoardLayout({
                width: layout.width,
                height: layout.height,
              });
            }}
            onTouchStart={(event: unknown) => {
              const sample = createTraceSample(event);
              pendingTraceStartRef.current = sample;
            }}
            onMoveShouldSetResponder={() => Boolean(boardBounds)}
            onResponderGrant={(event: unknown) => {
              if (!boardBounds) {
                return;
              }

              const startSample =
                pendingTraceStartRef.current ?? createTraceSample(event);
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
            }}
            onResponderMove={(event: unknown) => {
              if (!boardBounds || !traceIdRef.current) {
                return;
              }

              void props.on_apply_trace_selection(
                {
                  trace_id: traceIdRef.current,
                  phase: "move",
                  samples: [createTraceSample(event)],
                },
                boardBounds,
              );
            }}
            onResponderRelease={(event: unknown) => {
              if (!boardBounds || !traceIdRef.current) {
                pendingTraceStartRef.current = null;
                return;
              }

              void props.on_apply_trace_selection(
                {
                  trace_id: traceIdRef.current,
                  phase: "end",
                  samples: [createTraceSample(event)],
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
        </SectionCard>

        <SectionCard eyebrow="Feedback" title="Last resolution">
          <Text style={styles.cardText}>
            {currentFeedback ??
              "Trace or tap a path, then cast. Invalid and repeated spells do not spend a move."}
          </Text>
          <Text style={styles.cardTextMuted}>
            Repeated spells this run:{" "}
            {props.active_state.repeated_words.length === 0
              ? "none"
              : props.active_state.repeated_words.join(", ")}
          </Text>
        </SectionCard>
      </View>

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

function createTraceSample(event: unknown): TraceSample {
  const nativeEvent = (
    event as {
      nativeEvent?: {
        identifier?: number;
        locationX?: number;
        locationY?: number;
        timestamp?: number;
      };
    }
  ).nativeEvent;

  return {
    pointer_id: nativeEvent?.identifier ?? 0,
    x_px: nativeEvent?.locationX ?? 0,
    y_px: nativeEvent?.locationY ?? 0,
    t_ms: nativeEvent?.timestamp ?? Date.now(),
  };
}

function createTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
