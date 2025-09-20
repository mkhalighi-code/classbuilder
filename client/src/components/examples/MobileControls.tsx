import MobileControls from "../MobileControls";

const mockWakeLock = {
  isSupported: true,
  isActive: false,
  requestWakeLock: async () => {
    console.log("Wake lock requested");
    return true;
  },
  releaseWakeLock: async () => {
    console.log("Wake lock released");
  },
};

const mockFullscreen = {
  isSupported: true,
  isFullscreen: false,
  toggleFullscreen: async () => {
    console.log("Fullscreen toggled");
    return true;
  },
};

export default function MobileControlsExample() {
  return (
    <div className="h-screen bg-timer-combo flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Mobile Controls Demo</h1>
        <p className="text-lg opacity-90">Mobile-specific controls for wake lock and fullscreen</p>
      </div>

      <MobileControls
        wakeLock={mockWakeLock}
        fullscreen={mockFullscreen}
        isTimerRunning={true}
      />
    </div>
  );
}