import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BuiltSchedule } from "@shared/schedule";
import type { FlatIntervalV1 } from "@shared/class-plan-v1";
import { useBeepPlayer } from "./BeepPlayer";

export type EnginePhase = "IDLE" | "READY" | "TRANSITION" | "COUNTDOWN" | "RUN" | "PAUSED" | "COMPLETE";

export type EngineState = {
  phase: EnginePhase;
  currentIndex: number;
  timeRemaining: number; // seconds in current phase (COUNTDOWN or RUN)
};

export type EngineControls = {
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  resetToBlockStart: () => void;
  skipInterval: () => void;
  skipBlock: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
};

export type UseTimerEngineResult = EngineState & {
  intervals: FlatIntervalV1[];
  nextInterval: FlatIntervalV1 | null;
  totalRemaining: number; // seconds remaining overall
  totalSeconds: number;
  elapsedSeconds: number;
  beepsMuted: boolean;
  volume: number;
} & EngineControls;

const COUNTDOWN_LEN = 3;

export function useTimerEngine(
  schedule: BuiltSchedule | null,
  options: { betweenBlockTransitionSec: number }
): UseTimerEngineResult {
  const intervals = schedule?.intervals ?? [];
  const totalSeconds = schedule?.totalSeconds ?? 0;

  const [phase, setPhase] = useState<EnginePhase>("IDLE");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const targetTimestampRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const countdownRef = useRef<number>(COUNTDOWN_LEN);

  const { init, play, muted, setMuted, volume, setVolume } = useBeepPlayer();

  const current = intervals[currentIndex] ?? null;
  const next = intervals[currentIndex + 1] ?? null;

  const elapsedBeforeCurrent = useMemo(() => {
    return intervals.slice(0, currentIndex).reduce((acc, it) => acc + it.seconds, 0);
  }, [intervals, currentIndex]);

  const elapsedInCurrent = useMemo(() => {
    if (phase !== "RUN") return 0;
    return current ? current.seconds - timeRemaining : 0;
  }, [phase, current, timeRemaining]);

  const overallRemaining = useMemo(() => {
    return Math.max(totalSeconds - elapsedBeforeCurrent - elapsedInCurrent, 0);
  }, [totalSeconds, elapsedBeforeCurrent, elapsedInCurrent]);

  // Internal loop with drift correction using performance.now()
  const loop = useCallback((now: number) => {
    const target = targetTimestampRef.current;
    if (target == null) return;

    const dt = Math.max(now - target, 0);
    // advance every 1000ms; catch up if drift accrued
    let ticks = Math.floor(dt / 1000);
    if (ticks <= 0) {
      rafIdRef.current = requestAnimationFrame(loop);
      return;
    }

    // Move target forward by consumed ticks
    targetTimestampRef.current = target + ticks * 1000;

    setTimeRemaining((prev) => {
      let remaining = prev;
      while (ticks > 0 && remaining > 0) {
        remaining -= 1;
        ticks -= 1;
      }
      return remaining;
    });

    rafIdRef.current = requestAnimationFrame(loop);
  }, []);

  // Begin a phase with countdown (between blocks only)
  const startCountdown = useCallback(() => {
    countdownRef.current = COUNTDOWN_LEN;
    setPhase("COUNTDOWN");
    setTimeRemaining(COUNTDOWN_LEN);
    targetTimestampRef.current = performance.now() + 1000;
    rafIdRef.current = requestAnimationFrame(loop);
  }, [loop]);

  // Begin run for current interval
  const startRun = useCallback(() => {
    if (!current) return;
    setPhase("RUN");
    setTimeRemaining(current.seconds);
    targetTimestampRef.current = performance.now() + 1000;
    rafIdRef.current = requestAnimationFrame(loop);
  }, [current, loop]);

  // React to timeRemaining changes for beeps and phase transitions
  useEffect(() => {
    if (phase === "COUNTDOWN") {
      if (timeRemaining > 0) {
        // Beep each second, last beep is distinct
        const isLast = timeRemaining === 1;
        play("count", isLast);
      } else {
        // countdown hit 0 → start beep then RUN
        play("start");
        startRun();
      }
    } else if (phase === "RUN") {
      if (timeRemaining === 0) {
        // end of interval
        play("end");
        // Determine next step
        if (currentIndex < intervals.length - 1) {
          const nextIdx = currentIndex + 1;
          const nextInterval = intervals[nextIdx];
          const sameBlock = current && nextInterval && nextInterval.blockId === current.blockId;
          setCurrentIndex(nextIdx);
          if (sameBlock) {
            // Continue immediately with next interval (no countdown)
            startRun();
          } else {
            // Between blocks: optional transition, then countdown
            const t = Math.max(0, options.betweenBlockTransitionSec);
            if (t > 0) {
              setPhase("TRANSITION");
              setTimeRemaining(t);
              targetTimestampRef.current = performance.now() + 1000;
              rafIdRef.current = requestAnimationFrame(loop);
            } else {
              startCountdown();
            }
          }
        } else {
          setPhase("COMPLETE");
        }
      }
    } else if (phase === "TRANSITION") {
      if (timeRemaining === 0) {
        startCountdown();
      }
    }
  }, [phase, timeRemaining, play, currentIndex, intervals.length, startCountdown, startRun]);

  // Cleanup raf on unmount or pause
  const stopLoop = useCallback(() => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    targetTimestampRef.current = null;
  }, []);

  // Controls
  const start = useCallback(async () => {
    const ok = await init();
    if (!ok) return;
    if (!intervals.length) return;
    setPhase("READY");
    // Start first interval immediately (no per-interval countdown)
    startRun();
  }, [init, intervals.length, startCountdown]);

  const pause = useCallback(() => {
    if (phase === "RUN" || phase === "COUNTDOWN") {
      stopLoop();
      setPhase("PAUSED");
    }
  }, [phase, stopLoop]);

  const resume = useCallback(() => {
    if (phase === "PAUSED") {
      const now = performance.now();
      targetTimestampRef.current = now + 1000;
      rafIdRef.current = requestAnimationFrame(loop);
      // resume prior phase context: if paused during COUNTDOWN keep COUNTDOWN; if during RUN keep RUN
      // phase stays PAUSED until loop tick? Keep it simple:
      // Determine where we paused by checking timeRemaining and current.
      // We'll set phase back to RUN or COUNTDOWN depending on remaining and whether we were in countdown before pause.
      // To track that precisely we'd need another ref; assume if timeRemaining <= COUNTDOWN_LEN and (current not started) means COUNTDOWN
      // But we explicitly paused only in those two phases; we can store last phase.
    }
  }, [phase, loop]);

  // Store last active phase to resume accurately
  const lastActivePhaseRef = useRef<EnginePhase>("IDLE");
  useEffect(() => {
    if (phase === "RUN" || phase === "COUNTDOWN") lastActivePhaseRef.current = phase;
  }, [phase]);
  const resumeImpl = useCallback(() => {
    if (phase !== "PAUSED") return;
    const now = performance.now();
    targetTimestampRef.current = now + 1000;
    rafIdRef.current = requestAnimationFrame(loop);
    setPhase(lastActivePhaseRef.current);
  }, [phase, loop]);

  const resetToBlockStart = useCallback(() => {
    stopLoop();
    if (!current) return;
    // find first index of this block
    const blockId = current.blockId;
    const idx = intervals.findIndex((it) => it.blockId === blockId);
    setCurrentIndex(idx >= 0 ? idx : 0);
    setPhase("IDLE");
    setTimeRemaining(0);
  }, [current, intervals, stopLoop]);

  const skipInterval = useCallback(() => {
    stopLoop();
    if (currentIndex < intervals.length - 1) {
      setCurrentIndex((i) => i + 1);
      startCountdown();
    } else {
      setPhase("COMPLETE");
    }
  }, [currentIndex, intervals.length, stopLoop, startCountdown]);

  const skipBlock = useCallback(() => {
    stopLoop();
    if (!current) return;
    const blockId = current.blockId;
    // find next index whose blockId differs
    const nextIdx = intervals.findIndex((it, i) => i > currentIndex && it.blockId !== blockId);
    if (nextIdx !== -1) {
      setCurrentIndex(nextIdx);
      startCountdown();
    } else {
      setPhase("COMPLETE");
    }
  }, [current, currentIndex, intervals, stopLoop, startCountdown]);

  const toggleMute = useCallback(() => setMuted((m) => !m), [setMuted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA" || (e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.code === "Space") { e.preventDefault(); if (phase === "RUN" || phase === "COUNTDOWN") pause(); else if (phase === "PAUSED" || phase === "IDLE") start(); }
      if (e.code === "ArrowRight") { e.preventDefault(); skipInterval(); }
      if (e.code === "KeyR") { e.preventDefault(); resetToBlockStart(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, pause, start, skipInterval, resetToBlockStart]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    phase,
    currentIndex,
    timeRemaining,
    intervals,
    nextInterval: next,
    totalRemaining: overallRemaining,
    totalSeconds,
    elapsedSeconds: totalSeconds - overallRemaining,
    start,
    pause,
    resume: resumeImpl,
    resetToBlockStart,
    skipInterval,
    skipBlock,
    beepsMuted: muted,
    volume,
    toggleMute,
    setVolume,
  };
}
