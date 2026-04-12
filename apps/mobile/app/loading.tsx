import { LoadingScreen } from "../src/mobileShell/screens/BootstrapStatusScreen.tsx";
import { MobileScreenFrame } from "../src/mobileShell/components/MobileScreenFrame.tsx";
import { RouteGate } from "../src/mobileShell/components/RouteGate.tsx";

export default function LoadingRoute(): JSX.Element {
  return (
    <RouteGate route_path="/loading">
      <MobileScreenFrame>
        <LoadingScreen />
      </MobileScreenFrame>
    </RouteGate>
  );
}
