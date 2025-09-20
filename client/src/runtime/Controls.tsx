import { EnginePhase } from "./TimerEngine";

export function Controls({
  phase,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkipInterval,
  onSkipBlock,
  muted,
  volume,
  onToggleMute,
  onVolume,
}: {
  phase: EnginePhase;
  onStart: () => void | Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkipInterval: () => void;
  onSkipBlock: () => void;
  muted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolume: (v: number) => void;
}) {
  const isRunning = phase === "RUN" || phase === "COUNTDOWN";
  return (
    <div className="border-t p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button onClick={onPause} className="px-4 py-2 rounded bg-secondary text-secondary-foreground">Pause</button>
        ) : phase === "PAUSED" || phase === "IDLE" ? (
          <button onClick={onStart} className="px-4 py-2 rounded bg-primary text-primary-foreground">Start</button>
        ) : phase === "COMPLETE" ? (
          <button onClick={onReset} className="px-4 py-2 rounded bg-primary text-primary-foreground">Reset</button>
        ) : (
          <button onClick={onResume} className="px-4 py-2 rounded bg-primary text-primary-foreground">Resume</button>
        )}

        <button onClick={onReset} className="px-3 py-2 rounded border">Reset to Block Start</button>
        <button onClick={onSkipInterval} className="px-3 py-2 rounded border">Skip Interval</button>
        <button onClick={onSkipBlock} className="px-3 py-2 rounded border">Skip Block</button>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={onToggleMute} className="px-3 py-2 rounded border min-w-24">{muted ? "Unmute" : "Mute"}</button>
        <div className="flex items-center gap-2 text-sm">
          <span>Vol</span>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => onVolume(parseFloat(e.target.value))} />
        </div>
      </div>
    </div>
  );
}
