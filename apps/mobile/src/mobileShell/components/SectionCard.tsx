import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { styles } from "../mobileStyles.ts";

export function SectionCard(props: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
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
