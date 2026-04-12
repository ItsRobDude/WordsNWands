import { Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ensureMobileRuntimeInitialized } from "../src/mobileShell/runtime.ts";

export const unstable_settings = {
  initialRouteName: "loading",
};

export default function RootLayout(): JSX.Element {
  useEffect(() => {
    void ensureMobileRuntimeInitialized();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </SafeAreaProvider>
  );
}
