import type { FlatIntervalV1 } from "@shared/class-plan-v1";
import { formatTime } from "@shared/timer-utils";

export function Display({
  current,
  next,
  timeRemaining,
  totalRemaining,
  totalSeconds,
  elapsedSeconds,
}: {
  current: FlatIntervalV1 | null;
  next: FlatIntervalV1 | null;
  timeRemaining: number;
  totalRemaining: number;
  totalSeconds: number;
  elapsedSeconds: number;
}) {
  const pct = totalSeconds > 0 ? Math.min(100, Math.max(0, Math.round((elapsedSeconds / totalSeconds) * 100))) : 0;
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6">
      <div className="w-full max-w-xl mb-2">
        <div className="h-2 bg-muted rounded">
          <div className="h-2 bg-primary rounded" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Overall Progress: {pct}%</div>
      </div>
      <div className="text-center space-y-2">
        <div className="text-sm text-muted-foreground">Current Block</div>
        <div className="text-xl font-semibold">{current?.blockTitle ?? "—"}</div>
        <div className="text-sm text-muted-foreground">{current?.blockObjective ?? ""}</div>
      </div>
      <div className="text-center">
        <div className="text-5xl font-bold tracking-tight">{current?.label ?? "Waiting"}</div>
        <div className="mt-2 text-6xl font-mono tabular-nums">{formatTime(Math.max(timeRemaining,0))}</div>
        {current && (
          <div className="mt-1 text-xs text-muted-foreground">Round {current.round} / {current.totalRounds}</div>
        )}
      </div>
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Next Up</div>
          <div>Total Remaining: {formatTime(Math.max(totalRemaining,0))}</div>
        </div>
        <div className="mt-1 p-3 rounded border">
          {next ? (
            <div className="flex items-center justify-between">
              <div className="font-medium">{next.label}</div>
              <div className="font-mono">{formatTime(next.seconds)}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">—</div>
          )}
        </div>
      </div>
    </div>
  );
}
