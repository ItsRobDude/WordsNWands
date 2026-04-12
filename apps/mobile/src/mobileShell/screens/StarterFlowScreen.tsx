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
        eyebrow="First Spell"
        title="Welcome to the meadow"
        accent="warm"
      >
        <Text style={styles.cardText}>
          Words become spells here. The starter duel teaches the board, the
          countdown, and how creature weaknesses change the fight.
        </Text>
        {props.starter_intro_flavor_text ? (
          <Text style={styles.cardTextMuted}>
            {props.starter_intro_flavor_text}
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard
        eyebrow="Starter Teaching"
        title="Bloom first, then read the clock"
      >
        <Text style={styles.cardText}>
          Start with the guided path, watch the countdown tick, and learn how a
          creature answers back before you move on.
        </Text>
        <Text style={styles.cardTextMuted}>
          You can build a spell by tracing across touching tiles or by tapping
          them in order and casting when ready.
        </Text>
      </SectionCard>

      {props.can_resume_encounter ? (
        <ActionButton
          label="Resume Starter Encounter"
          onPress={props.on_resume}
        />
      ) : (
        <ActionButton
          label="Enter Starter Encounter"
          onPress={() => {
            void props.on_enter_starter();
          }}
        />
      )}

      {props.has_completed_starter_encounter ? (
        <ActionButton
          label="Skip To Home"
          onPress={props.on_skip_to_home}
          tone="secondary"
        />
      ) : null}
    </View>
  );
}
