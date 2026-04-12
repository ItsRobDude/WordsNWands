import { Text, View } from "react-native";

import { styles } from "../mobileStyles.ts";

export function StatPill(props: {
  label: string;
  value: string;
  compact?: boolean;
}): JSX.Element {
  return (
    <View
      style={[styles.statPill, props.compact ? styles.statPillCompact : null]}
    >
      <Text
        style={[
          styles.statLabel,
          props.compact ? styles.statLabelCompact : null,
        ]}
      >
        {props.label}
      </Text>
      <Text
        style={[
          styles.statValue,
          props.compact ? styles.statValueCompact : null,
        ]}
      >
        {props.value}
      </Text>
    </View>
  );
}
