import { Text, View } from "react-native";

import type { MobileAppStoreState } from "../store/createMobileAppStore.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import { SectionCard } from "../components/SectionCard.tsx";
import { styles } from "../mobileStyles.ts";

export function StarterFlowScreen(props: {
  has_completed_starter_encounter: boolean;
  can_resume_encounter: boolean;
  starter_intro_flavor_text: string | null;
  on_resume: MobileAppStoreState["actions"]["resumeEncounter"];
  on_enter_starter: () => Promise<void>;
  on_skip_to_home: () => void;
}): JSX.Element {
  return (
    <View style={styles.stack}>
      <SectionCard
        eyebrow="Words 'n Wands!"
        title="Main Menu"
        accent="warm"
        style={styles.launchHeroCard}
        eyebrow_style={styles.launchHeroEyebrow}
        title_style={styles.launchHeroMenuTitle}
      >
        <Text style={styles.launchHeroTitle}>Words 'n Wands</Text>
        <Text style={styles.launchHeroSubtitle}>
          Build words from touching letters, strike creature weaknesses, and
          keep the magical countdown from turning against you.
        </Text>
      </SectionCard>

      <SectionCard
        eyebrow="Main Menu"
        title="Choose your next step"
        style={styles.launchMenuCard}
        title_style={styles.encounterCardTitle}
      >
        <Text style={styles.cardText}>
          Start drops you straight into the first meadow duel. If you already
          have a battle in progress, resume picks that exact run back up.
        </Text>
        {props.starter_intro_flavor_text ? (
          <Text style={styles.launchMenuNote}>
            {props.starter_intro_flavor_text}
          </Text>
        ) : (
          <Text style={styles.launchMenuNote}>
            The opening is intentionally simple: start the duel, learn the
            board, then unlock the wider meadow adventure.
          </Text>
        )}
        <View style={styles.buttonStack}>
          {props.can_resume_encounter ? (
            <ActionButton label="Resume Encounter" onPress={props.on_resume} />
          ) : props.has_completed_starter_encounter ? (
            <ActionButton
              label="Continue Adventure"
              onPress={props.on_skip_to_home}
            />
          ) : (
            <ActionButton
              label="Start Adventure"
              onPress={() => {
                void props.on_enter_starter();
              }}
            />
          )}

          {props.has_completed_starter_encounter ? (
            <ActionButton
              label="Replay Starter Duel"
              onPress={() => {
                void props.on_enter_starter();
              }}
              tone="secondary"
            />
          ) : null}

          {props.can_resume_encounter &&
          props.has_completed_starter_encounter ? (
            <ActionButton
              label="Continue Adventure"
              onPress={props.on_skip_to_home}
              tone="ghost"
            />
          ) : null}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Current Build" title="What is live right now">
        <Text style={styles.cardTextMuted}>
          This slice focuses on the real battle loop first: starter flow, Home,
          active encounters, pause, restore, and results.
        </Text>
        {props.has_completed_starter_encounter ? (
          <ActionButton
            label="Return To Home"
            onPress={props.on_skip_to_home}
            tone="ghost"
          />
        ) : null}
      </SectionCard>
    </View>
  );
}
