import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Text, View } from "react-native";

import { styles } from "../mobileStyles.ts";

export function SectionCard(props: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  accent?: "warm" | "cool";
  style?: StyleProp<ViewStyle>;
  body_style?: StyleProp<ViewStyle>;
  eyebrow_style?: StyleProp<TextStyle>;
  title_style?: StyleProp<TextStyle>;
}): JSX.Element {
  return (
    <View
      style={[
        styles.card,
        props.accent === "warm" ? styles.cardWarm : null,
        props.accent === "cool" ? styles.cardCool : null,
        props.style,
      ]}
    >
      <Text style={[styles.cardEyebrow, props.eyebrow_style]}>
        {props.eyebrow}
      </Text>
      <Text style={[styles.cardTitle, props.title_style]}>{props.title}</Text>
      <View style={[styles.cardBody, props.body_style]}>{props.children}</View>
    </View>
  );
}
