import { Pressable, Text } from "react-native";

import { styles } from "../mobileStyles.ts";

export function ActionButton(props: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "ghost";
  compact?: boolean;
  disabled?: boolean;
}): JSX.Element {
  return (
    <Pressable
      disabled={props.disabled}
      onPress={props.onPress}
      style={[
        styles.button,
        props.tone === "secondary" ? styles.buttonSecondary : null,
        props.tone === "ghost" ? styles.buttonGhost : null,
        props.compact ? styles.buttonCompact : null,
        props.disabled ? styles.buttonDisabled : null,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          props.tone === "secondary" ? styles.buttonLabelSecondary : null,
          props.tone === "ghost" ? styles.buttonLabelGhost : null,
        ]}
      >
        {props.label}
      </Text>
    </Pressable>
  );
}
