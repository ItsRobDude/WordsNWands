import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  type BoardPosition,
  type BoardTile,
  type EncounterRuntimeState,
  type HeadlessTranscriptEntry,
} from "../../packages/game-rules/src/index.ts";
import type { AppPrimarySurface } from "../../packages/game-rules/src/contracts/core.ts";
import { normalizeTracedBoardLetters } from "../../packages/validation/src/index.ts";

import {
  applySubmissionToEncounterRun,
  createFreshEncounterRun,
  getEncounterPayload,
  getPrimaryChapter,
  getStarterEncounterId,
  type MobileEncounterRun,
} from "./src/verticalSlice/encounterRuntime.ts";
import {
  describeCastResolution,
  describeStarterHint,
  describeTileState,
} from "./src/verticalSlice/formatters.ts";

export default function App(): JSX.Element {
  const starterEncounterId = useMemo(() => getStarterEncounterId(), []);
  const primaryChapter = useMemo(() => getPrimaryChapter(), []);
  const meadowEncounterId = primaryChapter.encounter_ids[0] ?? "enc_meadow_001";

  const [surface, setSurface] = useState<AppPrimarySurface>("starter_flow");
  const [hasCompletedStarterEncounter, setHasCompletedStarterEncounter] =
    useState(false);
  const [attemptsByEncounter, setAttemptsByEncounter] = useState<
    Record<string, number>
  >({});
  const [completedEncounterIds, setCompletedEncounterIds] = useState<string[]>(
    [],
  );
  const [activeRun, setActiveRun] = useState<MobileEncounterRun | null>(null);
  const [selectedPath, setSelectedPath] = useState<BoardPosition[]>([]);
  const [lastTranscriptEntry, setLastTranscriptEntry] =
    useState<HeadlessTranscriptEntry | null>(null);

  const activeState = activeRun?.runtime_state ?? null;
  const tileMap = useMemo(() => buildTileMap(activeState), [activeState]);
  const selectedWord = useMemo(
    () => resolveSelectedWord(selectedPath, tileMap),
    [selectedPath, tileMap],
  );
  const currentFeedback = describeCastResolution(lastTranscriptEntry);
  const starterHint = activeState
    ? describeStarterHint({
        runtime_state: activeState,
        transcript_entry: lastTranscriptEntry,
        encounter_id: activeRun?.encounter_id ?? "",
      })
    : null;

  const starterEncounter = useMemo(
    () => getEncounterPayload(starterEncounterId),
    [starterEncounterId],
  );
  const meadowEncounter = useMemo(
    () => getEncounterPayload(meadowEncounterId),
    [meadowEncounterId],
  );

  const launchEncounter = (encounterId: string): void => {
    const attemptNumber = (attemptsByEncounter[encounterId] ?? 0) + 1;
    setAttemptsByEncounter((current) => ({
      ...current,
      [encounterId]: attemptNumber,
    }));
    setActiveRun(
      createFreshEncounterRun({
        encounter_id: encounterId,
        attempt_number: attemptNumber,
      }),
    );
    setLastTranscriptEntry(null);
    setSelectedPath([]);
    setSurface("encounter");
  };

  const handleTilePress = (tile: BoardTile): void => {
    if (!activeState || activeState.session_state !== "in_progress") {
      return;
    }

    setSelectedPath((currentPath) => {
      const tileKey = toPositionKey(tile.position);
      const existingIndex = currentPath.findIndex(
        (position) => toPositionKey(position) === tileKey,
      );

      if (existingIndex >= 0) {
        return currentPath.slice(0, existingIndex + 1);
      }

      if (currentPath.length === 0) {
        return [{ ...tile.position }];
      }

      const lastPosition = currentPath[currentPath.length - 1];
      if (!lastPosition || !isAdjacent(lastPosition, tile.position)) {
        return [{ ...tile.position }];
      }

      return [...currentPath, { ...tile.position }];
    });
  };

  const submitSelectedPath = (): void => {
    if (!activeRun || selectedPath.length === 0 || !selectedWord) {
      return;
    }

    const result = applySubmissionToEncounterRun({
      run: activeRun,
      submission: {
        selected_positions: selectedPath.map((position) => ({ ...position })),
        traced_word_display: selectedWord.toUpperCase(),
      },
    });

    const nextState = result.run.runtime_state;
    setActiveRun(result.run);
    setLastTranscriptEntry(result.transcript_entry);
    setSelectedPath([]);

    if (nextState.session_state === "won") {
      if (result.run.encounter_id === starterEncounterId) {
        setHasCompletedStarterEncounter(true);
      }
      setCompletedEncounterIds((current) =>
        current.includes(result.run.encounter_id)
          ? current
          : [...current, result.run.encounter_id],
      );
      setSurface("result");
      return;
    }

    if (
      nextState.session_state === "lost" ||
      nextState.session_state === "recoverable_error"
    ) {
      setSurface("result");
    }
  };

  const resultPrimaryLabel = resolveResultPrimaryLabel({
    active_run: activeRun,
    starter_encounter_id: starterEncounterId,
  });

  const resultTitle = resolveResultTitle(activeState);
  const resultBody = resolveResultBody(activeRun, activeState);

  const renderStarterFlow = () => (
    <View style={styles.stack}>
      <SectionCard eyebrow="First Spell" title="Words ’n Wands" accent="warm">
        <Text style={styles.cardText}>
          Slip straight into the starter encounter. The goal of this first slice
          is to put the real battle rules, validation lookup, and authored
          content on a live mobile screen.
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
          The opening board now uses an authored layout so the guided LEAF cast
          is genuinely present. After that, the encounter keeps running on the
          shared engine.
        </Text>
        <Text style={styles.cardTextMuted}>
          Input note: this first mobile slice uses tap-chaining instead of the
          final swipe gesture contract.
        </Text>
      </SectionCard>

      <ActionButton
        label="Enter Starter Encounter"
        onPress={() => launchEncounter(starterEncounterId)}
      />

      {hasCompletedStarterEncounter ? (
        <ActionButton
          label="Skip To Home"
          onPress={() => setSurface("home")}
          tone="secondary"
        />
      ) : null}
    </View>
  );

  const renderHome = () => (
    <View style={styles.stack}>
      <SectionCard
        eyebrow="Home"
        title={primaryChapter.display_name}
        accent="cool"
      >
        <Text style={styles.cardText}>
          Starter cleared: {hasCompletedStarterEncounter ? "yes" : "not yet"}.
        </Text>
        <Text style={styles.cardText}>
          Next mainline encounter: {meadowEncounter.creature.displayName}.
        </Text>
        <Text style={styles.cardTextMuted}>
          {meadowEncounter.encounter.introFlavorText}
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
          Routing, persistence, and swipe-native input are still follow-up work.
          The live encounter transitions already come from shared package code.
        </Text>
      </SectionCard>

      <ActionButton
        label="Continue Chapter 1"
        onPress={() => launchEncounter(meadowEncounterId)}
      />
      <ActionButton
        label="Replay Starter"
        onPress={() => launchEncounter(starterEncounterId)}
        tone="secondary"
      />
    </View>
  );

  const renderEncounter = () => {
    if (!activeRun || !activeState) {
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
            activeRun.encounter_payload.encounter.isStarterEncounter
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

        <SectionCard eyebrow="Board" title="Tap adjacent tiles to trace">
          <Text style={styles.cardTextMuted}>
            Current trace: {selectedWord ? selectedWord.toUpperCase() : "none"}
          </Text>
          <View style={styles.board}>
            {renderBoardRows(activeState, selectedPath, handleTilePress)}
          </View>
          <View style={styles.actionsRow}>
            <ActionButton
              label="Clear Trace"
              onPress={() => setSelectedPath([])}
              tone="secondary"
              compact
            />
            <ActionButton
              label="Cast Word"
              onPress={submitSelectedPath}
              compact
              disabled={selectedPath.length === 0}
            />
          </View>
        </SectionCard>

        <SectionCard eyebrow="Feedback" title="Last Resolution">
          <Text style={styles.cardText}>
            {currentFeedback ??
              "Trace a word to watch the shared battle engine resolve damage, countdowns, board collapse, refill, and creature spells."}
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
          onPress={() =>
            setSurface(hasCompletedStarterEncounter ? "home" : "starter_flow")
          }
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
        label={resultPrimaryLabel}
        onPress={() =>
          handleResultPrimaryAction({
            active_run: activeRun,
            starter_encounter_id: starterEncounterId,
            launch_encounter: launchEncounter,
            set_surface: setSurface,
          })
        }
      />

      <ActionButton
        label={
          hasCompletedStarterEncounter
            ? "Return To Home"
            : "Return To Starter Intro"
        }
        onPress={() =>
          setSurface(hasCompletedStarterEncounter ? "home" : "starter_flow")
        }
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
            Shared encounter rules running inside the mobile shell.
          </Text>
        </View>

        {surface === "starter_flow" ? renderStarterFlow() : null}
        {surface === "home" ? renderHome() : null}
        {surface === "encounter" ? renderEncounter() : null}
        {surface === "result" ? renderResult() : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function renderBoardRows(
  state: EncounterRuntimeState,
  selectedPath: readonly BoardPosition[],
  onTilePress: (tile: BoardTile) => void,
): JSX.Element[] {
  const selectedKeys = new Set(selectedPath.map(toPositionKey));

  return Array.from({ length: state.board.height }, (_, rowIndex) => (
    <View key={`row-${rowIndex}`} style={styles.boardRow}>
      {Array.from({ length: state.board.width }, (_, colIndex) => {
        const tile = state.board.tiles.find(
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
            onPress={() => onTilePress(tile)}
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

function buildTileMap(
  state: EncounterRuntimeState | null,
): ReadonlyMap<string, BoardTile> {
  if (!state) {
    return new Map();
  }

  return new Map(
    state.board.tiles.map((tile) => [toPositionKey(tile.position), tile]),
  );
}

function resolveSelectedWord(
  selectedPath: readonly BoardPosition[],
  tileMap: ReadonlyMap<string, BoardTile>,
): string {
  if (selectedPath.length === 0) {
    return "";
  }

  return normalizeTracedBoardLetters(
    selectedPath
      .map((position) => tileMap.get(toPositionKey(position))?.letter ?? "")
      .filter((letter) => letter.length > 0),
  );
}

function resolveResultPrimaryLabel(input: {
  active_run: MobileEncounterRun | null;
  starter_encounter_id: string;
}): string {
  const activeState = input.active_run?.runtime_state;
  if (!activeState) {
    return "Return To Home";
  }

  if (activeState.session_state === "won") {
    return input.active_run?.encounter_id === input.starter_encounter_id
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

function resolveResultBody(
  activeRun: MobileEncounterRun | null,
  activeState: EncounterRuntimeState | null,
): string {
  if (!activeRun || !activeState) {
    return "The encounter has no active runtime snapshot yet.";
  }

  if (activeState.session_state === "won") {
    return activeRun.encounter_id === "enc_starter_001"
      ? "Starter complete. The next step is the first chapter encounter in Sunspell Meadow."
      : `${activeState.creature.display_name} settled down. The shared content and battle packages carried the full run to a clean win.`;
  }

  if (activeState.session_state === "recoverable_error") {
    return "The board could not recover from a deterministic dead-board path. Retrying starts a fresh session.";
  }

  return `${activeState.creature.display_name} still has ${activeState.creature.hp_current} HP left. Retrying creates a fresh encounter run.`;
}

function handleResultPrimaryAction(input: {
  active_run: MobileEncounterRun | null;
  starter_encounter_id: string;
  launch_encounter: (encounterId: string) => void;
  set_surface: (surface: AppPrimarySurface) => void;
}): void {
  const activeRun = input.active_run;
  const activeState = activeRun?.runtime_state;

  if (!activeRun || !activeState) {
    input.set_surface("home");
    return;
  }

  if (activeState.session_state === "won") {
    input.set_surface("home");
    return;
  }

  input.launch_encounter(activeRun.encounter_id);
}

function toPositionKey(position: BoardPosition): string {
  return `${position.row}:${position.col}`;
}

function isAdjacent(left: BoardPosition, right: BoardPosition): boolean {
  const rowDelta = Math.abs(left.row - right.row);
  const colDelta = Math.abs(left.col - right.col);

  return rowDelta <= 1 && colDelta <= 1 && rowDelta + colDelta > 0;
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
