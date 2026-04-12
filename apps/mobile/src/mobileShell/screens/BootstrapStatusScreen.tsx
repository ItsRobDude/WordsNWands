import { Text } from "react-native";

import type { MobileAppStoreState } from "../store/createMobileAppStore.ts";
import { ActionButton } from "../components/ActionButton.tsx";
import { SectionCard } from "../components/SectionCard.tsx";
import { styles } from "../mobileStyles.ts";

export function LoadingScreen(): JSX.Element {
  return (
    <SectionCard eyebrow="Launch" title="Preparing the journey" accent="cool">
      <Text style={styles.cardText}>
        Gathering your settings, saved progress, and any unfinished encounter.
      </Text>
      <Text style={styles.cardTextMuted}>
        If a battle was left mid-run, the app will return you to the safest
        place automatically.
      </Text>
    </SectionCard>
  );
}

export function ErrorScreen(props: {
  hydration_error: string | null;
  on_retry: MobileAppStoreState["actions"]["initialize"];
}): JSX.Element {
  return (
    <SectionCard
      eyebrow="Launch"
      title="Session restore hit a snag"
      accent="warm"
    >
      <Text style={styles.cardText}>
        {props.hydration_error ??
          "The app could not finish restoring local progress for this session."}
      </Text>
      <ActionButton
        label="Retry Bootstrap"
        onPress={() => {
          void props.on_retry();
        }}
      />
    </SectionCard>
  );
}
