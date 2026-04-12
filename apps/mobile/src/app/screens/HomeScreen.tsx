import { Text, View } from "react-native";

import type { EncounterRuntimeState } from "../../../../../packages/game-rules/src/index.ts";
import type { MobileAppStoreState } from "../store/createMobileAppStore.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import { SectionCard } from "../components/SectionCard.tsx";
import { StatPill } from "../components/StatPill.tsx";
import { styles } from "../mobileStyles.ts";

export function HomeScreen(props: {
  has_completed_starter_encounter: boolean;
  primary_encounter_name: string;
  primary_intro_flavor_text: string | null;
  completed_encounter_ids: readonly string[];
  can_resume_encounter: boolean;
  active_state: EncounterRuntimeState | null;
  on_resume: MobileAppStoreState["actions"]["resumeEncounter"];
  on_continue_chapter: () => Promise<void>;
  on_replay_starter: () => Promise<void>;
}): JSX.Element {
  return (
    <View style={styles.stack}>
      <SectionCard eyebrow="Home" title="Sunspell Meadow" accent="cool">
        <Text style={styles.cardText}>
          {props.has_completed_starter_encounter
            ? "The starter gate is open. Your next adventure is waiting."
            : "The starter encounter still guards the meadow path."}
        </Text>
        <Text style={styles.cardText}>
          Next creature: {props.primary_encounter_name}.
        </Text>
        {props.primary_intro_flavor_text ? (
          <Text style={styles.cardTextMuted}>
            {props.primary_intro_flavor_text}
          </Text>
        ) : null}
      </SectionCard>

      {props.can_resume_encounter && props.active_state ? (
        <SectionCard eyebrow="Resume" title="Paused encounter">
          <View style={styles.statsRow}>
            <StatPill
              label="Creature HP"
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
            Resume picks the battle back up where you left it.
          </Text>
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Progress" title="Adventure notes">
        <Text style={styles.cardText}>
          Cleared encounters:{" "}
          {props.completed_encounter_ids.length === 0
            ? "none yet"
            : props.completed_encounter_ids.join(", ")}
        </Text>
        <Text style={styles.cardTextMuted}>
          Replaying the starter is always available if you want another guided
          warm-up.
        </Text>
      </SectionCard>

      {props.can_resume_encounter ? (
        <ActionButton label="Resume Encounter" onPress={props.on_resume} />
      ) : (
        <ActionButton
          label="Continue Chapter 1"
          onPress={() => {
            void props.on_continue_chapter();
          }}
        />
      )}

      <ActionButton
        label="Replay Starter"
        onPress={() => {
          void props.on_replay_starter();
        }}
        tone="secondary"
      />
    </View>
  );
}
