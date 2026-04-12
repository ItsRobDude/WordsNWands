import { Text, View } from "react-native";

import { styles } from "../mobileStyles.ts";

export function AppHeader(): JSX.Element {
  return (
    <View style={styles.header}>
      <Text style={styles.overline}>SUNSPELL MEADOW</Text>
      <Text style={styles.title}>Words ’n Wands</Text>
      <Text style={styles.subtitle}>
        Build a spell from touching letters, beat the countdown, and calm the
        creature before your moves run dry.
      </Text>
    </View>
  );
}
