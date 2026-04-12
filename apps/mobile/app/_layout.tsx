import {
  Stack,
  router,
  usePathname,
  useRootNavigationState,
} from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useStore } from "zustand";

import {
  ensureMobileRuntimeInitialized,
  mobileRuntime,
  resolveRoutePath,
} from "../src/mobileShell/runtime.ts";

export const unstable_settings = {
  initialRouteName: "loading",
};

export default function RootLayout(): JSX.Element {
  const rootNavigationState = useRootNavigationState();
  const hydrationStatus = useStore(
    mobileRuntime.store,
    (state) => state.mobileSlice.hydration_status,
  );
  const surface = useStore(
    mobileRuntime.store,
    (state) => state.sessionSlice.app_primary_surface,
  );
  const pathname = usePathname();

  useEffect(() => {
    void ensureMobileRuntimeInitialized();
  }, []);

  useEffect(() => {
    if (!rootNavigationState?.key) {
      return;
    }

    const targetPath = resolveRoutePath({
      hydration_status: hydrationStatus,
      surface,
    });

    if (pathname !== targetPath) {
      router.replace(targetPath);
    }
  }, [hydrationStatus, pathname, rootNavigationState?.key, surface]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </SafeAreaProvider>
  );
}
