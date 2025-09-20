import { useMemo, useState } from "react";
import PlanLoader from "@/runtime/PlanLoader";
import { buildSchedule } from "@shared/schedule";
import type { ClassPlanV1 } from "@shared/class-plan-v1";
import { SAMPLE_5_MIN, SAMPLE_30_MIN, SAMPLE_45_MIN } from "@shared/sample-plans-v1";
import { useTimerEngine } from "@/runtime/TimerEngine";
import { Display } from "@/runtime/Display";
import { Controls } from "@/runtime/Controls";
import { Sidebar } from "@/runtime/Sidebar";

export default function Runtime() {
  const [plan, setPlan] = useState<ClassPlanV1 | null>(null);
  const [transitionQuery, setTransitionQuery] = useState<null | number>(null);

  const schedule = useMemo(() => (plan ? buildSchedule(plan, { defaultBetweenBlockTransitionSec: 0 }) : null), [plan]);

  const effectiveTransitionSec = transitionQuery ?? 0;
  const engine = useTimerEngine(schedule, { betweenBlockTransitionSec: effectiveTransitionSec });

  if (!plan) {
    return (
      <PlanLoader
        onLoad={setPlan}
        samples={[
          { name: "5 min", plan: SAMPLE_5_MIN },
          { name: "30 min", plan: SAMPLE_30_MIN },
          { name: "45 min", plan: SAMPLE_45_MIN },
        ]}
      />
    );
  }

  // Simple startup customization prompt for between-block transition
  if (transitionQuery === null) {
    return (
      <div className="h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full border rounded p-5 space-y-4">
          <h2 className="text-lg font-semibold">Between-block transition</h2>
          <p className="text-sm text-muted-foreground">Do you want transition time in between each of the blocks? If yes, how long (seconds)?</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded border" onClick={() => setTransitionQuery(0)}>No transition</button>
            <button className="px-3 py-2 rounded border" onClick={() => setTransitionQuery(15)}>15s</button>
            <button className="px-3 py-2 rounded border" onClick={() => setTransitionQuery(30)}>30s</button>
          </div>
          <div className="text-xs text-muted-foreground">You can reset the block to re-choose later.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <Sidebar intervals={engine.intervals} currentIndex={engine.currentIndex} />
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Class</div>
            <h1 className="text-xl font-semibold">{plan.class_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded border" onClick={() => setTransitionQuery(null)}>Change transition</button>
            <button className="px-3 py-2 rounded border" onClick={() => setPlan(null)}>Load New Plan</button>
          </div>
        </header>
        <Display
          current={engine.intervals[engine.currentIndex] ?? null}
          next={engine.nextInterval}
          timeRemaining={engine.timeRemaining}
          totalRemaining={engine.totalRemaining}
          totalSeconds={engine.totalSeconds}
          elapsedSeconds={engine.elapsedSeconds}
        />
        <Controls
          phase={engine.phase}
          onStart={() => engine.start()}
          onPause={engine.pause}
          onResume={engine.resume}
          onReset={engine.resetToBlockStart}
          onSkipInterval={engine.skipInterval}
          onSkipBlock={engine.skipBlock}
          muted={engine.beepsMuted}
          volume={engine.volume}
          onToggleMute={engine.toggleMute}
          onVolume={engine.setVolume}
        />
      </div>
    </div>
  );
}
