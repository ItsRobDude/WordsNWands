import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { styles } from "../mobileStyles.ts";
import { AppHeader } from "./AppHeader.tsx";

export function MobileScreenFrame(props: {
  children?: ReactNode;
  show_header?: boolean;
  scroll_enabled?: boolean;
}): JSX.Element {
  const content = (
    <>
      {props.show_header === false ? null : <AppHeader />}
      {props.children}
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundOrbA} />
      <View style={styles.backgroundOrbB} />
      {props.scroll_enabled === false ? (
        <View style={styles.frameContent}>{content}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
