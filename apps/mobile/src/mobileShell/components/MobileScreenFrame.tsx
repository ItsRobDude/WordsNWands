import { SafeAreaView, ScrollView, View } from "react-native";

import { styles } from "../mobileStyles.ts";
import { AppHeader } from "./AppHeader.tsx";

export function MobileScreenFrame(props: {
  children?: JSX.Element | JSX.Element[] | null;
  show_header?: boolean;
}): JSX.Element {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.backgroundOrbA} />
      <View style={styles.backgroundOrbB} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {props.show_header === false ? null : <AppHeader />}
        {props.children}
      </ScrollView>
    </SafeAreaView>
  );
}
