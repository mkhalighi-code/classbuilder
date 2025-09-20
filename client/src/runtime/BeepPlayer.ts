import { useCallback, useRef, useState } from "react";

export type BeepKind = "count" | "start" | "end";

export function useBeepPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const ensureContext = useCallback(async () => {
    if (!audioContextRef.current && typeof window !== "undefined") {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return false;
      audioContextRef.current = new Ctx();
    }
    const ctx = audioContextRef.current;
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return true;
  }, []);

  const init = useCallback(async () => {
    const ok = await ensureContext();
    setReady(ok);
    return ok;
  }, [ensureContext]);

  const play = useCallback(async (kind: BeepKind, isCountdownLast = false) => {
    if (muted) return;
    const ok = await ensureContext();
    if (!ok || !audioContextRef.current) return;
    const ctx = audioContextRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Frequencies: count 3/2 beeps=800Hz, last count=1200Hz, start=1000Hz, end=600Hz
    let freq = 800;
    let dur = 0.12;
    switch (kind) {
      case "count":
        freq = isCountdownLast ? 1200 : 800;
        dur = isCountdownLast ? 0.25 : 0.12;
        break;
      case "start":
        freq = 1000; dur = 0.18; break;
      case "end":
        freq = 600; dur = 0.18; break;
    }

    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.type = "sine"; // sine/triangle OK

    const vol = Math.min(Math.max(volume, 0), 1) * 0.2; // cap overall
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + dur);

    osc.start();
    osc.stop(ctx.currentTime + dur + 0.01);
  }, [ensureContext, muted, volume]);

  return {
    ready,
    muted,
    volume,
    setMuted,
    setVolume,
    init,
    play,
  };
}
