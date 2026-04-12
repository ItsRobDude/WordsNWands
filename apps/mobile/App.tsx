import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useStore } from "zustand";

import type {
  BoardPosition,
  BoardTile,
  EncounterRuntimeState,
} from "../../packages/game-rules/src/index.ts";

import { createSQLiteAppPersistence } from "./src/app/persistence/createSQLiteAppPersistence.ts";
import {
  createMobileAppStore,
  getPrimaryEncounterId,
} from "./src/app/store/createMobileAppStore.ts";
import { getBundledPhaseOneContent } from "./src/verticalSlice/bundledContent.ts";
import {
  getEncounterPayload,
  getStarterEncounterId,
} from "./src/verticalSlice/encounterRuntime.ts";
import {
  describeCastResolution,
  describeStarterHint,
  describeTileState,
} from "./src/verticalSlice/formatters.ts";

export default function App(): JSX.Element {
  const bundledContent = useMemo(() => getBundledPhaseOneContent(), []);
  const starterEncounterId = useMemo(
    () => getStarterEncounterId(bundledContent),
    [bundledContent],
  );
  const primaryEncounterId = useMemo(
    () => getPrimaryEncounterId(bundledContent),
    [bundledContent],
  );
  const starterEncounter = useMemo(
    () =>
      getEncounterPayload({
        content: bundledContent,
        encounter_id: starterEncounterId,
      }),
    [bundledContent, starterEncounterId],
  );
  const primaryEncounter = useMemo(
    () =>
      getEncounterPayload({
        content: bundledContent,
        encounter_id: primaryEncounterId,
      }),
    [bundledContent, primaryEncounterId],
  );
  const traceIdRef = useRef<string | null>(null);
  const pendingTraceStartRef = useRef<TraceSample | null>(null);
  const [boardLayout, setBoardLayout] = useState<BoardLayout | null>(null);
  const store = useMemo(
    () =>
      createMobileAppStore({
        persistence: createSQLiteAppPersistence(),
        content: bundledContent,
      }),
    [bundledContent],
  );

  useEffect(() => {
    void store.getState().actions.initialize();
  }, [store]);

  const surface = useStore(
    store,
    (state) => state.sessionSlice.app_primary_surface,
  );
  const hasCompletedStarterEncounter = useStore(
    store,
    (state) => state.sessionSlice.has_completed_starter_encounter === 1,
  );
  const activeState = useStore(
    store,
    (state) => state.encounterSlice.runtime_state,
  );
  const previewPath = useStore(
    store,
    (state) => state.uiSlice.swipe_preview_path,
  );
  const previewWord = useStore(
    store,
    (state) => state.uiSlice.highlighted_word_preview,
  );
  const lastTranscriptEntry = useStore(
    store,
    (state) => state.mobileSlice.last_transcript_entry,
  );
  const completedEncounterIds = useStore(
    store,
    (state) => state.mobileSlice.completed_encounter_ids,
  );
  const hydrationStatus = useStore(
    store,
    (state) => state.mobileSlice.hydration_status,
  );
  const hydrationError = useStore(
    store,
    (state) => state.mobileSlice.hydration_error_message,
  );
  const canResumeEncounter = useStore(
    store,
    (state) =>
      state.encounterSlice.runtime_state?.session_state === "in_progress",
  );

  const currentFeedback = describeCastResolution(lastTranscriptEntry);
  const starterHint = activeState
    ? describeStarterHint({
        runtime_state: activeState,
        transcript_entry: lastTranscriptEntry,
        encounter_id: activeState.encounter_id,
      })
    : null;
  const resultTitle = resolveResultTitle(activeState);
  const resultBody = resolveResultBody({
    active_state: activeState,
    starter_encounter_id: starterEncounterId,
  });
  const boardBounds = boardLayout
    ? {
        board_left_px: 0,
        board_top_px: 0,
        board_width_px: boardLayout.width,
        board_height_px: boardLayout.height,
        rows: activeState?.board.height ?? 0,
        cols: activeState?.board.width ?? 0,
      }
    : null;

  const renderLoading = () => (
    <SectionCard eyebrow="Launch" title="Preparing the session" accent="cool">
      <Text style={styles.cardText}>
        Hydrating bundled content, local profile state, and any saved encounter
        snapshot.
      </Text>
      <Text style={styles.cardTextMuted}>
        This store-backed slice now restores from SQLite when a saved encounter
        exists.
      </Text>
    </SectionCard>
  );

  const renderError = () => (
    <SectionCard
      eyebrow="Launch"
      title="Session restore hit a snag"
      accent="warm"
    >
      <Text style={styles.cardText}>
        {hydrationError ??
          "The app could not finish bootstrapping local state for this session."}
      </Text>
      <ActionButton
        label="Retry Bootstrap"
        onPress={() => {
          void store.getState().actions.initialize();
        }}
      />
    </SectionCard>
  );

  const renderStarterFlow = () => (
    <View style={styles.stack}>
      <SectionCard eyebrow="First Spell" title="Words ’n Wands" accent="warm">
        <Text style={styles.cardText}>
          Slip straight into the starter encounter. The live mobile slice now
          routes through a store-backed session model, persists snapshots
          locally, and restores active runs on launch.
        </Text>
        <Text style={styles.cardTextMuted}>
          {starterEncounter.encounter.introFlavorText}
        </Text>
      </SectionCard>

      <SectionCard
        eyebrow="Starter Teaching"
        title="Bloom first, then watch the countdown"
      >
        <Text style={styles.cardText}>
          The opening board uses an authored layout so the guided LEAF cast is
          genuinely present. After that, the encounter keeps running on the
          shared engine.
        </Text>
        <Text style={styles.cardTextMuted}>
          Current input surface supports tap-built paths and release-to-cast
          tracing on the same shared selection pipeline.
        </Text>
      </SectionCard>

      {canResumeEncounter ? (
        <ActionButton
          label="Resume Starter Encounter"
          onPress={() => store.getState().actions.resumeEncounter()}
        />
      ) : (
        <ActionButton
          label="Enter Starter Encounter"
          onPress={() => {
            void store.getState().actions.launchEncounter(starterEncounterId);
          }}
        />
      )}

      {hasCompletedStarterEncounter ? (
        <ActionButton
          label="Skip To Home"
          onPress={() => store.getState().actions.setSurface("home")}
          tone="secondary"
        />
      ) : null}
    </View>
  );

  const renderHome = () => (
    <View style={styles.stack}>
      <SectionCard eyebrow="Home" title="Sunspell Meadow" accent="cool">
        <Text style={styles.cardText}>
          Starter cleared: {hasCompletedStarterEncounter ? "yes" : "not yet"}.
        </Text>
        <Text style={styles.cardText}>
          Next mainline encounter: {primaryEncounter.creature.displayName}.
        </Text>
        <Text style={styles.cardTextMuted}>
          {primaryEncounter.encounter.introFlavorText}
        </Text>
      </SectionCard>

      <SectionCard eyebrow="Progress" title="Current slice status">
        <Text style={styles.cardText}>
          Completed encounters:{" "}
          {completedEncounterIds.length === 0
            ? "none yet"
            : completedEncounterIds.join(", ")}
        </Text>
        <Text style={styles.cardTextMuted}>
          Encounter state now persists locally and can restore back into battle
          or result view. Full progression persistence and richer app routing
          are still follow-up work.
        </Text>
      </SectionCard>

      {canResumeEncounter ? (
        <ActionButton
          label="Resume Encounter"
          onPress={() => store.getState().actions.resumeEncounter()}
        />
      ) : (
        <ActionButton
          label="Continue Chapter 1"
          onPress={() => {
            void store.getState().actions.launchEncounter(primaryEncounterId);
          }}
        />
      )}

      <ActionButton
        label="Replay Starter"
        onPress={() => {
          void store.getState().actions.launchEncounter(starterEncounterId);
        }}
        tone="secondary"
      />
    </View>
  );

  const renderEncounter = () => {
    if (!activeState) {
      return (
        <SectionCard eyebrow="Encounter" title="No active encounter">
          <Text style={styles.cardText}>
            Launch an encounter from the starter flow or home screen.
          </Text>
        </SectionCard>
      );
    }

    return (
      <View style={styles.stack}>
        <SectionCard
          eyebrow={
            activeState.encounter_id === starterEncounterId
              ? "Starter Encounter"
              : "Active Encounter"
          }
          title={activeState.creature.display_name}
          accent="cool"
        >
          <View style={styles.statsRow}>
            <StatPill
              label="HP"
              value={`${activeState.creature.hp_current}/${activeState.creature.hp_max}`}
            />
            <StatPill
              label="Moves"
              value={`${activeState.moves_remaining}/${activeState.move_budget_total}`}
            />
            <StatPill
              label="Countdown"
              value={`${activeState.creature.spell_countdown_current}`}
            />
          </View>
          <Text style={styles.cardTextMuted}>
            Weak to {activeState.creature.weakness_element}. Resists{" "}
            {activeState.creature.resistance_element}.
          </Text>
        </SectionCard>

        {starterHint ? (
          <SectionCard eyebrow="Guidance" title="Current Cue">
            <Text style={styles.cardText}>{starterHint}</Text>
          </SectionCard>
        ) : null}

        <SectionCard eyebrow="Board" title="Build a word path">
          <Text style={styles.cardTextMuted}>
            Current preview: {previewWord || "none"}
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
              void store.getState().actions.applyTraceSelection(
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

              void store.getState().actions.applyTraceSelection(
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

              void store.getState().actions.applyTraceSelection(
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

              void store.getState().actions.applyTraceSelection(
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
            {renderBoardRows({
              state: activeState,
              selected_path: previewPath,
              on_tile_press: (tile) =>
                store.getState().actions.selectBoardPosition(tile.position),
            })}
          </View>
          <View style={styles.actionsRow}>
            <ActionButton
              label="Clear Path"
              onPress={() => store.getState().actions.clearSelection()}
              tone="secondary"
              compact
            />
            <ActionButton
              label="Cast Word"
              onPress={() => {
                void store.getState().actions.submitSelection();
              }}
              compact
              disabled={previewPath.length === 0}
            />
          </View>
        </SectionCard>

        <SectionCard eyebrow="Feedback" title="Last Resolution">
          <Text style={styles.cardText}>
            {currentFeedback ??
              "Build a word to watch the shared battle engine resolve damage, countdowns, board collapse, refill, and creature spells."}
          </Text>
          <Text style={styles.cardTextMuted}>
            Repeated spells used this run:{" "}
            {activeState.repeated_words.length === 0
              ? "none"
              : activeState.repeated_words.join(", ")}
          </Text>
        </SectionCard>

        <ActionButton
          label="Leave Encounter"
          onPress={() => store.getState().actions.leaveEncounter()}
          tone="ghost"
        />
      </View>
    );
  };

  const renderResult = () => (
    <View style={styles.stack}>
      <SectionCard eyebrow="Result" title={resultTitle} accent="warm">
        <Text style={styles.cardText}>{resultBody}</Text>
        {currentFeedback ? (
          <Text style={styles.cardTextMuted}>{currentFeedback}</Text>
        ) : null}
      </SectionCard>

      {activeState ? (
        <SectionCard eyebrow="Run Snapshot" title="Encounter Summary">
          <View style={styles.statsRow}>
            <StatPill
              label="HP Left"
              value={`${activeState.creature.hp_current}`}
            />
            <StatPill
              label="Moves Left"
              value={`${activeState.moves_remaining}`}
            />
            <StatPill
              label="Resolved Casts"
              value={`${activeState.casts_resolved_count}`}
            />
          </View>
        </SectionCard>
      ) : null}

      <ActionButton
        label={resolveResultPrimaryLabel({
          active_state: activeState,
          starter_encounter_id: starterEncounterId,
        })}
        onPress={() => {
          void store.getState().actions.advanceFromResult();
        }}
      />

      <ActionButton
        label={
          hasCompletedStarterEncounter
            ? "Return To Home"
            : "Return To Starter Intro"
        }
        onPress={() => {
          void store.getState().actions.returnFromResult();
        }}
        tone="secondary"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundOrbA} />
      <View style={styles.backgroundOrbB} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.overline}>ANDROID-FIRST VERTICAL SLICE</Text>
          <Text style={styles.title}>Words ’n Wands</Text>
          <Text style={styles.subtitle}>
            Shared encounter rules running inside a restored mobile session.
          </Text>
        </View>

        {hydrationStatus === "loading" || hydrationStatus === "idle"
          ? renderLoading()
          : null}
        {hydrationStatus === "error" ? renderError() : null}

        {hydrationStatus === "ready" && surface === "starter_flow"
          ? renderStarterFlow()
          : null}
        {hydrationStatus === "ready" && surface === "home"
          ? renderHome()
          : null}
        {hydrationStatus === "ready" && surface === "encounter"
          ? renderEncounter()
          : null}
        {hydrationStatus === "ready" && surface === "result"
          ? renderResult()
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

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

function renderBoardRows(input: {
  state: EncounterRuntimeState;
  selected_path: readonly BoardPosition[];
  on_tile_press: (tile: BoardTile) => void;
}): JSX.Element[] {
  const selectedKeys = new Set(input.selected_path.map(toPositionKey));

  return Array.from({ length: input.state.board.height }, (_, rowIndex) => (
    <View key={`row-${rowIndex}`} style={styles.boardRow}>
      {Array.from({ length: input.state.board.width }, (_, colIndex) => {
        const tile = input.state.board.tiles.find(
          (candidate) =>
            candidate.position.row === rowIndex &&
            candidate.position.col === colIndex,
        );

        if (!tile) {
          return (
            <View key={`empty-${rowIndex}-${colIndex}`} style={styles.tile} />
          );
        }

        const isSelected = selectedKeys.has(toPositionKey(tile.position));

        return (
          <Pressable
            key={tile.id}
            onPress={() => input.on_tile_press(tile)}
            style={[
              styles.tile,
              isSelected ? styles.tileSelected : null,
              tile.state ? styles.tileAffected : null,
            ]}
          >
            <Text style={styles.tileLetter}>{tile.letter}</Text>
            {describeTileState(tile.state) ? (
              <Text style={styles.tileMeta}>
                {describeTileState(tile.state)}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  ));
}

function resolveResultPrimaryLabel(input: {
  active_state: EncounterRuntimeState | null;
  starter_encounter_id: string;
}): string {
  if (!input.active_state) {
    return "Return To Home";
  }

  if (input.active_state.session_state === "won") {
    return input.active_state.encounter_id === input.starter_encounter_id
      ? "Begin Chapter 1"
      : "Return To Home";
  }

  return "Retry Encounter";
}

function resolveResultTitle(activeState: EncounterRuntimeState | null): string {
  if (!activeState) {
    return "Encounter Complete";
  }

  if (activeState.session_state === "won") {
    return "Creature Calmed";
  }

  if (activeState.session_state === "recoverable_error") {
    return "Magic Board Recovery Failed";
  }

  return "Try Another Spell";
}

function resolveResultBody(input: {
  active_state: EncounterRuntimeState | null;
  starter_encounter_id: string;
}): string {
  if (!input.active_state) {
    return "The encounter has no active runtime snapshot yet.";
  }

  if (input.active_state.session_state === "won") {
    return input.active_state.encounter_id === input.starter_encounter_id
      ? "Starter complete. The next step is the first chapter encounter in Sunspell Meadow."
      : `${input.active_state.creature.display_name} settled down. The shared content and battle packages carried the full run to a clean win.`;
  }

  if (input.active_state.session_state === "recoverable_error") {
    return "The board could not recover from a deterministic dead-board path. Retrying starts a fresh encounter run.";
  }

  return `${input.active_state.creature.display_name} still has ${input.active_state.creature.hp_current} HP left. Retrying creates a fresh encounter run.`;
}

function toPositionKey(position: BoardPosition): string {
  return `${position.row}:${position.col}`;
}

function SectionCard(props: {
  eyebrow: string;
  title: string;
  children?: JSX.Element | JSX.Element[] | null;
  accent?: "warm" | "cool";
}): JSX.Element {
  return (
    <View
      style={[
        styles.card,
        props.accent === "warm" ? styles.cardWarm : null,
        props.accent === "cool" ? styles.cardCool : null,
      ]}
    >
      <Text style={styles.cardEyebrow}>{props.eyebrow}</Text>
      <Text style={styles.cardTitle}>{props.title}</Text>
      <View style={styles.cardBody}>{props.children}</View>
    </View>
  );
}

function StatPill(props: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={styles.statValue}>{props.value}</Text>
    </View>
  );
}

function ActionButton(props: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "ghost";
  compact?: boolean;
  disabled?: boolean;
}): JSX.Element {
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={[
        styles.button,
        props.tone === "secondary" ? styles.buttonSecondary : null,
        props.tone === "ghost" ? styles.buttonGhost : null,
        props.compact ? styles.buttonCompact : null,
        props.disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          props.tone === "secondary" ? styles.buttonLabelSecondary : null,
          props.tone === "ghost" ? styles.buttonLabelGhost : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f1726",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  backgroundOrbA: {
    position: "absolute",
    top: -80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#f59e0b22",
  },
  backgroundOrbB: {
    position: "absolute",
    left: -40,
    bottom: 60,
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: "#38bdf822",
  },
  header: {
    marginBottom: 18,
    paddingTop: 8,
  },
  overline: {
    color: "#fcd34d",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: 8,
    color: "#f8fafc",
    fontSize: 34,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 10,
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 23,
  },
  stack: {
    gap: 14,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#132033",
    borderWidth: 1,
    borderColor: "#24364f",
  },
  cardWarm: {
    backgroundColor: "#22161c",
    borderColor: "#5b3142",
  },
  cardCool: {
    backgroundColor: "#102536",
    borderColor: "#25455d",
  },
  cardEyebrow: {
    color: "#93c5fd",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  cardTitle: {
    marginTop: 6,
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "700",
  },
  cardBody: {
    marginTop: 14,
    gap: 12,
  },
  cardText: {
    color: "#e2e8f0",
    fontSize: 15,
    lineHeight: 22,
  },
  cardTextMuted: {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statPill: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#0b1524",
    borderWidth: 1,
    borderColor: "#24364f",
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statValue: {
    marginTop: 4,
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
  },
  board: {
    gap: 8,
  },
  boardRow: {
    flexDirection: "row",
    gap: 8,
  },
  tile: {
    flex: 1,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#08111d",
    borderWidth: 1,
    borderColor: "#28415e",
    paddingVertical: 8,
  },
  tileSelected: {
    backgroundColor: "#433316",
    borderColor: "#fbbf24",
  },
  tileAffected: {
    borderColor: "#7dd3fc",
  },
  tileLetter: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
  },
  tileMeta: {
    marginTop: 4,
    color: "#7dd3fc",
    fontSize: 11,
    fontWeight: "700",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: "#f59e0b",
  },
  buttonSecondary: {
    backgroundColor: "#1f2f47",
    borderWidth: 1,
    borderColor: "#345172",
  },
  buttonGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#345172",
  },
  buttonCompact: {
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: "#5b6472",
    borderColor: "#5b6472",
  },
  buttonLabel: {
    color: "#101827",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  buttonLabelSecondary: {
    color: "#e2e8f0",
  },
  buttonLabelGhost: {
    color: "#bfdbfe",
  },
});
