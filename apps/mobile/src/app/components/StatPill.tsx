import { Text, View } from "react-native";

import { styles } from "../mobileStyles.ts";

export function StatPill(props: { label: string; value: string }): JSX.Element {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{props.label}</Text>
      <Text style={styles.statValue}>{props.value}</Text>
    </View>
  );
}
