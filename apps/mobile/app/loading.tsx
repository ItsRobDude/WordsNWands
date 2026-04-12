import { LoadingScreen } from "../src/mobileShell/screens/BootstrapStatusScreen.tsx";
import { MobileScreenFrame } from "../src/mobileShell/components/MobileScreenFrame.tsx";

export default function LoadingRoute(): JSX.Element {
  return (
    <MobileScreenFrame>
      <LoadingScreen />
    </MobileScreenFrame>
  );
}
