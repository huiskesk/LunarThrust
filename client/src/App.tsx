import "@fontsource/inter";
import { MoonLander } from "./components/MoonLander";
import { MoonLanderHUD } from "./components/MoonLanderHUD";
import { MoonLanderMenu } from "./components/MoonLanderMenu";
import { SoundManager } from "./components/SoundManager";

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <MoonLander />
      <MoonLanderHUD />
      <MoonLanderMenu />
      <SoundManager />
    </div>
  );
}

export default App;
