import { Text, View } from "react-native";

import type { EncounterRuntimeState } from "../../../../../packages/game-rules/src/index.ts";
import type { MobileAppStoreState } from "../store/createMobileAppStore.ts";
import { describeCastResolution } from "../../verticalSlice/formatters.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import { SectionCard } from "../components/SectionCard.tsx";
import { StatPill } from "../components/StatPill.tsx";
import { styles } from "../mobileStyles.ts";
import { resolveResultScreenContent } from "./screenFlow.ts";

export function ResultScreen(props: {
  active_state: EncounterRuntimeState | null;
  starter_encounter_id: string;
  has_completed_starter_encounter: boolean;
  on_advance: MobileAppStoreState["actions"]["advanceFromResult"];
  on_return: MobileAppStoreState["actions"]["returnFromResult"];
  last_feedback: ReturnType<typeof describeCastResolution>;
}): JSX.Element {
  const content = resolveResultScreenContent({
    active_state: props.active_state,
    starter_encounter_id: props.starter_encounter_id,
    has_completed_starter_encounter: props.has_completed_starter_encounter,
  });

  return (
    <View style={styles.stack}>
      <SectionCard eyebrow="Result" title={content.title} accent="warm">
        <Text style={styles.cardText}>{content.body}</Text>
        {props.last_feedback ? (
          <Text style={styles.cardTextMuted}>{props.last_feedback}</Text>
        ) : null}
      </SectionCard>

      {props.active_state ? (
        <SectionCard eyebrow="Run Snapshot" title="Encounter summary">
          <View style={styles.statsRow}>
            <StatPill
              label="HP Left"
              value={`${props.active_state.creature.hp_current}`}
            />
            <StatPill
              label="Moves Left"
              value={`${props.active_state.moves_remaining}`}
            />
            <StatPill
              label="Resolved Casts"
              value={`${props.active_state.casts_resolved_count}`}
            />
          </View>
        </SectionCard>
      ) : null}

      <ActionButton
        label={content.primary_label}
        onPress={() => {
          void props.on_advance();
        }}
      />

      <ActionButton
        label={content.secondary_label}
        onPress={() => {
          void props.on_return();
        }}
        tone="secondary"
      />
    </View>
  );
}
