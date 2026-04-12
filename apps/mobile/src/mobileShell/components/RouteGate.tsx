import type { ReactNode } from "react";

import { Redirect } from "expo-router";
import { useStore } from "zustand";

import { mobileRuntime, resolveRoutePath, type RoutePath } from "../runtime.ts";

export function RouteGate(props: {
  route_path: RoutePath;
  children: ReactNode;
}): JSX.Element {
  const hydrationStatus = useStore(
    mobileRuntime.store,
    (state) => state.mobileSlice.hydration_status,
  );
  const surface = useStore(
    mobileRuntime.store,
    (state) => state.sessionSlice.app_primary_surface,
  );

  const targetPath = resolveRoutePath({
    hydration_status: hydrationStatus,
    surface,
  });

  if (targetPath !== props.route_path) {
    return <Redirect href={targetPath} />;
  }

  return <>{props.children}</>;
}
