import { useStore } from "zustand";

import { ErrorScreen } from "../src/mobileShell/screens/BootstrapStatusScreen.tsx";
import { MobileScreenFrame } from "../src/mobileShell/components/MobileScreenFrame.tsx";
import { mobileRuntime } from "../src/mobileShell/runtime.ts";

export default function ErrorRoute(): JSX.Element {
  const hydrationError = useStore(
    mobileRuntime.store,
    (state) => state.mobileSlice.hydration_error_message,
  );

  return (
    <MobileScreenFrame>
      <ErrorScreen
        hydration_error={hydrationError}
        on_retry={mobileRuntime.store.getState().actions.initialize}
      />
    </MobileScreenFrame>
  );
}
