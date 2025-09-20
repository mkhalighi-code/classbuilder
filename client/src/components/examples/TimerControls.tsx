import TimerControls from "../TimerControls";

export default function TimerControlsExample() {
  return (
    <div className="h-screen bg-timer-randomized flex items-center justify-center relative">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Timer Controls Demo</h1>
        <p className="text-lg opacity-90">Interactive controls are positioned at the bottom</p>
      </div>
      
      <TimerControls
        state="running"
        onPlay={() => console.log("Play clicked")}
        onPause={() => console.log("Pause clicked")}
        onNext={() => console.log("Next clicked")}
        onPrevious={() => console.log("Previous clicked")}
        onReset={() => console.log("Reset clicked")}
        onToggleAudio={() => console.log("Audio toggle clicked")}
        audioEnabled={true}
        canGoNext={true}
        canGoPrevious={true}
      />
    </div>
  );
}