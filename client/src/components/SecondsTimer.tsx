import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls"; 
import ProgramSidebar from "./ProgramSidebar";
import JsonLoader from "./JsonLoader";
import AudioManager, { useAudioManager } from "./AudioManager";
import AudioSettingsModal from "./AudioSettingsModal";
import PreStartModal from "./PreStartModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Users, Settings, Play } from "lucide-react";
import { useWakeLock } from "@/hooks/useWakeLock";
import { useFullscreen } from "@/hooks/useFullscreen";
import { flattenClassPlan, calculateTotalDuration, SAMPLE_CLASS_PLAN } from "@shared/timer-utils";
import type { ClassPlan, FlatInterval, TimerState, AudioSettings, InstructorSettings } from "@shared/timer-schema";

interface SecondsTimerProps {
  initialPlan?: ClassPlan;
  autoStart?: boolean;
  showSidebar?: boolean;
}

export default function SecondsTimer({ 
  initialPlan,
  autoStart = false,
  showSidebar = true 
}: SecondsTimerProps) {
  // Core state
  const [classPlan, setClassPlan] = useState<ClassPlan | null>(initialPlan || null);
  const [intervals, setIntervals] = useState<FlatInterval[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [state, setState] = useState<TimerState>("idle");
  const [totalDuration, setTotalDuration] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Audio settings with localStorage persistence
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem('audioSettings');
    return saved ? JSON.parse(saved) : {
      enableBeeps: true,
      enableVoice: true,
      enableStartBeep: true,
      enableEndBeep: true,
      enableLastThreeBeep: true,
      musicVolume: 0.7,
      voiceVolume: 0.9,
      beepVolume: 0.8,
      enableMetronome: false,
      metronomeBPM: 120,
    };
  });

  // Instructor settings
  const [instructorSettings, setInstructorSettings] = useState<InstructorSettings>({
    showPreStartModal: true,
    lockControls: false,
    showElapsedTime: true,
    showRemainingTime: true,
  });

  // UI state
  const [sidebarVisible, setSidebarVisible] = useState(showSidebar);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const [preStartModalOpen, setPreStartModalOpen] = useState(false);

  // Mobile features
  const wakeLock = useWakeLock();
  const fullscreen = useFullscreen();

  // Current interval
  const currentInterval = intervals[currentIndex] || null;
  const nextInterval = intervals[currentIndex + 1] || null;

  // Audio manager
  const audioManager = useAudioManager({
    settings: audioSettings,
    currentInterval,
    timeRemaining,
    isRunning: state === "running",
  });

  // Save audio settings to localStorage
  useEffect(() => {
    localStorage.setItem('audioSettings', JSON.stringify(audioSettings));
  }, [audioSettings]);

  // Show PreStartModal on mount if no plan is loaded
  useEffect(() => {
    if (!classPlan && instructorSettings.showPreStartModal) {
      setPreStartModalOpen(true);
    }
  }, [classPlan, instructorSettings.showPreStartModal]);

  // Load class plan
  const loadClassPlan = useCallback((plan: ClassPlan) => {
    const flatIntervals = flattenClassPlan(plan);
    const duration = calculateTotalDuration(plan);
    
    setClassPlan(plan);
    setIntervals(flatIntervals);
    setTotalDuration(duration);
    setCurrentIndex(0);
    setTimeRemaining(flatIntervals[0]?.duration || 0);
    setState("idle");
    setElapsedTime(0);
    
    // Show pre-start modal if enabled
    if (instructorSettings.showPreStartModal) {
      setPreStartModalOpen(true);
    }
    
    console.log("Loaded plan:", plan);
    console.log("Flattened intervals:", flatIntervals);
  }, [instructorSettings.showPreStartModal]);

  // Timer controls
  const handlePlay = useCallback(async () => {
    if (audioManager.audioPermission === "pending") {
      await audioManager.requestAudioPermission();
    }
    
    // Request wake lock when starting timer
    if (wakeLock.isSupported && !wakeLock.isActive) {
      await wakeLock.requestWakeLock();
    }
    
    // Close pre-start modal if open
    setPreStartModalOpen(false);
    setState("running");
  }, [audioManager, wakeLock]);

  const handleJumpToInterval = useCallback((index: number) => {
    if (index >= 0 && index < intervals.length) {
      setCurrentIndex(index);
      setTimeRemaining(intervals[index].duration);
      
      // Update elapsed time
      const elapsed = intervals.slice(0, index).reduce((sum, interval) => sum + interval.duration, 0);
      setElapsedTime(elapsed);
      
      if (state === "running") {
        setState("paused");
      }
    }
  }, [intervals, state]);

  const handleAudioSettingsChange = useCallback((newSettings: AudioSettings) => {
    setAudioSettings(newSettings);
  }, []);

  const handlePause = useCallback(() => {
    setState("paused");
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < intervals.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setTimeRemaining(intervals[newIndex].duration);
      
      // Update elapsed time
      const elapsed = intervals.slice(0, newIndex).reduce((sum, interval) => sum + interval.duration, 0);
      setElapsedTime(elapsed);
      
      if (state === "running") {
        setState("paused");
      }
    }
  }, [currentIndex, intervals, state]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setTimeRemaining(intervals[newIndex].duration);
      
      // Update elapsed time  
      const elapsed = intervals.slice(0, newIndex).reduce((sum, interval) => sum + interval.duration, 0);
      setElapsedTime(elapsed);
      
      if (state === "running") {
        setState("paused");
      }
    }
  }, [currentIndex, intervals, state]);

  const handleReset = useCallback(async () => {
    if (intervals.length > 0) {
      setCurrentIndex(0);
      setTimeRemaining(intervals[0].duration);
      setState("idle");
      setElapsedTime(0);
    }
    
    // Release wake lock when resetting
    if (wakeLock.isActive) {
      await wakeLock.releaseWakeLock();
    }
  }, [intervals, wakeLock]);

  const toggleAudio = useCallback(() => {
    setAudioSettings(prev => ({
      ...prev,
      enableBeeps: !prev.enableBeeps,
      enableVoice: !prev.enableVoice,
    }));
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (state !== "running" || !currentInterval) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Update elapsed time before changing interval
          const newElapsed = intervals.slice(0, currentIndex + 1).reduce((sum, interval) => sum + interval.duration, 0);
          setElapsedTime(newElapsed);

          // Move to next interval or complete
          if (currentIndex < intervals.length - 1) {
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);
            return intervals[newIndex].duration;
          } else {
            setState("completed");
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state, currentIndex, intervals, currentInterval]);

  // Handle edge cases and errors
  useEffect(() => {
    if (intervals.length === 0 && state === "running") {
      setState("idle");
      console.warn("Timer stopped: No intervals available");
    }

    if (currentIndex >= intervals.length && intervals.length > 0) {
      setCurrentIndex(intervals.length - 1);
      setState("completed");
    }
  }, [intervals, currentIndex, state]);

  // Release wake lock when timer completes or component unmounts
  useEffect(() => {
    if (state === "completed" && wakeLock.isActive) {
      wakeLock.releaseWakeLock();
    }
  }, [state, wakeLock]);

  useEffect(() => {
    // Cleanup wake lock on unmount
    return () => {
      if (wakeLock.isActive) {
        wakeLock.releaseWakeLock();
      }
    };
  }, [wakeLock]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) {
        return; // Don't trigger shortcuts when typing
      }

      switch (event.code) {
        case "Space":
          event.preventDefault();
          state === "running" ? handlePause() : handlePlay();
          break;
        case "ArrowRight":
          event.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          event.preventDefault();
          handlePrevious();
          break;
        case "KeyR":
          event.preventDefault();
          handleReset();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [state, handlePlay, handlePause, handleNext, handlePrevious, handleReset]);

  // Auto-start
  useEffect(() => {
    if (autoStart && intervals.length > 0 && state === "idle") {
      handlePlay();
    }
  }, [autoStart, intervals.length, state, handlePlay]);

  // Load sample plan on mount if no initial plan
  useEffect(() => {
    if (!classPlan) {
      loadClassPlan(SAMPLE_CLASS_PLAN);
    }
  }, [classPlan, loadClassPlan]);

  const progress = intervals.length > 0 ? currentIndex / intervals.length : 0;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarVisible && intervals.length > 0 && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "20rem", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="hidden md:block overflow-hidden"
          >
            <ProgramSidebar
              intervals={intervals}
              currentIndex={currentIndex}
              totalDuration={totalDuration}
              elapsedTime={elapsedTime}
              onJumpToInterval={handleJumpToInterval}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main timer area */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        {classPlan && (
          <div className="bg-background/80 backdrop-blur-sm border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">
                {classPlan.class_name || "Workout Session"}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {intervals.length} intervals
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="md:hidden"
                data-testid="button-toggle-sidebar"
              >
                Program
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAudioSettingsOpen(true)}
                data-testid="button-audio-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <JsonLoader onLoadPlan={loadClassPlan} />
            </div>
          </div>
        )}

        {/* Timer display */}
        <TimerDisplay
          currentInterval={currentInterval}
          timeRemaining={timeRemaining}
          state={state}
          progress={progress}
          nextInterval={nextInterval}
          intervals={intervals}
          currentIndex={currentIndex}
          elapsedTime={elapsedTime}
          totalDuration={totalDuration}
        />

        {/* Empty state */}
        {!classPlan && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-3xl font-bold text-foreground">
                  Welcome to Seconds Timer
                </h2>
                <p className="text-muted-foreground text-lg">
                  Load a JSON workout plan to get started with your interval training session.
                </p>
              </motion.div>
              
              <JsonLoader 
                onLoadPlan={loadClassPlan}
                trigger={
                  <Button size="lg" className="gap-2">
                    <FileText className="h-5 w-5" />
                    Load Workout Plan
                  </Button>
                }
              />
            </div>
          </div>
        )}

        {/* Timer controls */}
        {intervals.length > 0 && (
          <TimerControls
            state={state}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onReset={handleReset}
            onToggleAudio={() => setAudioSettings(prev => ({ ...prev, enableBeeps: !prev.enableBeeps }))}
            audioEnabled={audioSettings.enableBeeps || audioSettings.enableVoice}
            canGoNext={currentIndex < intervals.length - 1}
            canGoPrevious={currentIndex > 0}
            wakeLock={wakeLock}
            fullscreen={fullscreen}
          />
        )}

        {/* Audio manager */}
        <AudioManager
          settings={audioSettings}
          currentInterval={currentInterval}
          timeRemaining={timeRemaining}
          isRunning={state === "running"}
        />
      </div>

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        open={audioSettingsOpen}
        onOpenChange={setAudioSettingsOpen}
        settings={audioSettings}
        onSettingsChange={handleAudioSettingsChange}
      />

      {/* Pre-Start Modal */}
      <PreStartModal
        open={preStartModalOpen}
        onOpenChange={setPreStartModalOpen}
        classPlan={classPlan}
        totalDuration={totalDuration}
        intervalCount={intervals.length}
        audioSettings={audioSettings}
        onStart={handlePlay}
        onEditSettings={() => {
          setPreStartModalOpen(false);
          setAudioSettingsOpen(true);
        }}
        onLoadPlan={loadClassPlan}
      />
    </div>
  );
}