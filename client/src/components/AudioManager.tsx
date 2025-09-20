import { useEffect, useRef, useState } from "react";
import type { AudioSettings, FlatInterval } from "@shared/timer-schema";

interface AudioManagerProps {
  settings: AudioSettings;
  currentInterval: FlatInterval | null;
  timeRemaining: number;
  isRunning: boolean;
  onIntervalChange?: (interval: FlatInterval) => void;
}

// Audio manager hook for handling beeps and TTS
export function useAudioManager({
  settings,
  currentInterval, 
  timeRemaining,
  isRunning,
  onIntervalChange,
}: AudioManagerProps) {
  const audioContext = useRef<AudioContext | null>(null);
  const lastBeepRef = useRef<number>(0);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const [audioPermission, setAudioPermission] = useState<"granted" | "denied" | "pending">("pending");

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined" && window.AudioContext) {
      audioContext.current = new AudioContext();
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  // Request audio permission on user gesture
  const requestAudioPermission = async () => {
    try {
      // Initialize audio context if needed
      if (!audioContext.current && typeof window !== "undefined" && window.AudioContext) {
        audioContext.current = new AudioContext();
      }

      if (!audioContext.current) {
        console.warn("AudioContext not supported in this browser");
        setAudioPermission("denied");
        return;
      }
      
      if (audioContext.current.state === "suspended") {
        await audioContext.current.resume();
      }

      // Test audio with a silent beep
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);
      gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.current.currentTime + 0.001);

      setAudioPermission("granted");
      console.log("Audio permission granted");
    } catch (error) {
      console.warn("Audio permission denied:", error);
      setAudioPermission("denied");
    }
  };

  // Play countdown beep
  const playBeep = (isLast = false) => {
    if (!settings.enableBeeps || !audioContext.current || audioPermission !== "granted") return;

    try {
      // Check audio context state
      if (audioContext.current.state === "suspended") {
        audioContext.current.resume().catch(console.warn);
        return;
      }

      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      // Different pitch for last beep (higher pitch = more urgent)
      oscillator.frequency.setValueAtTime(isLast ? 1200 : 800, audioContext.current.currentTime);
      oscillator.type = "sine";

      // Volume control with smoother fade
      const volume = Math.min(settings.beepVolume * 0.15, 0.2); // Cap volume for safety
      gainNode.gain.setValueAtTime(0, audioContext.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.current.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.current.currentTime + 0.15);

      const duration = isLast ? 0.3 : 0.15; // Longer beep for final countdown
      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + duration);
    } catch (error) {
      console.warn("Error playing beep:", error);
    }
  };

  // Speak text using TTS
  const speak = (text: string) => {
    if (!settings.enableVoice || !speechSynthesis.current) return;

    try {
      // Cancel any ongoing speech
      speechSynthesis.current.cancel();
      
      // Wait a moment to ensure cancellation is processed
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = Math.min(settings.voiceVolume, 1);
        utterance.rate = 0.9; // Slightly slower for clarity during workouts
        utterance.pitch = 1;
        
        // Error handling for speech
        utterance.onerror = (event) => {
          console.warn("TTS error:", event.error);
        };

        utterance.onend = () => {
          console.log("TTS completed:", text);
        };

        // Check if speech synthesis is available and ready
        if (speechSynthesis.current && speechSynthesis.current.getVoices().length === 0) {
          // Voices not loaded yet, wait for them
          speechSynthesis.current.addEventListener('voiceschanged', () => {
            if (speechSynthesis.current) {
              speechSynthesis.current.speak(utterance);
            }
          }, { once: true });
        } else if (speechSynthesis.current) {
          speechSynthesis.current.speak(utterance);
        }
      }, 100);
    } catch (error) {
      console.warn("Error with text-to-speech:", error);
    }
  };

  // Handle countdown beeps (3, 2, 1)
  useEffect(() => {
    if (!isRunning || !currentInterval) return;

    if (timeRemaining <= 3 && timeRemaining > 0 && timeRemaining !== lastBeepRef.current) {
      const isLastBeep = timeRemaining === 1;
      playBeep(isLastBeep);
      lastBeepRef.current = timeRemaining;
    }
  }, [timeRemaining, isRunning, settings.enableBeeps, audioPermission]);

  // Handle interval changes (TTS announcements)
  useEffect(() => {
    if (!currentInterval) return;

    const activityName = currentInterval.activity;
    
    // Speak interval name at start
    if (settings.enableVoice) {
      const message = currentInterval.isRest ? "Rest time" : activityName;
      setTimeout(() => speak(message), 100); // Small delay to avoid audio conflicts
    }

    onIntervalChange?.(currentInterval);
  }, [currentInterval?.id, settings.enableVoice]);

  return {
    audioPermission,
    requestAudioPermission,
    playBeep,
    speak,
  };
}

// Component wrapper for audio permission UI
export default function AudioManager({ 
  settings, 
  currentInterval, 
  timeRemaining, 
  isRunning,
  onIntervalChange,
}: AudioManagerProps) {
  const { audioPermission, requestAudioPermission } = useAudioManager({
    settings,
    currentInterval,
    timeRemaining, 
    isRunning,
    onIntervalChange,
  });

  if (audioPermission === "pending") {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm text-center">
          <p className="text-sm text-foreground mb-3">
            Enable sound for beeps and voice cues
          </p>
          <button
            onClick={requestAudioPermission}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            data-testid="button-enable-audio"
          >
            Enable Sound
          </button>
        </div>
      </div>
    );
  }

  return null;
}