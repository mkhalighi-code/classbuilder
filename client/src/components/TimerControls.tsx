import { Play, Pause, SkipForward, SkipBack, RotateCcw, Volume2, VolumeX, Maximize, Minimize, Smartphone, SmartphoneCharging } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimerState } from "@shared/timer-schema";

interface TimerControlsProps {
  state: TimerState;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
  onToggleAudio: () => void;
  audioEnabled: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  // Mobile features passed from parent
  wakeLock?: {
    isSupported: boolean;
    isActive: boolean;
    requestWakeLock: () => Promise<boolean>;
    releaseWakeLock: () => Promise<void>;
  };
  fullscreen?: {
    isSupported: boolean;
    isFullscreen: boolean;
    toggleFullscreen: () => Promise<boolean>;
  };
}

export default function TimerControls({
  state,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onReset,
  onToggleAudio,
  audioEnabled,
  canGoNext,
  canGoPrevious,
  wakeLock,
  fullscreen,
}: TimerControlsProps) {

  return (
    <div className="fixed bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-background/80 backdrop-blur-lg border rounded-full shadow-lg p-2">
        <div className="flex items-center gap-2">
          {/* Previous */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onPrevious}
            disabled={!canGoPrevious}
            data-testid="button-previous"
            className="h-12 w-12 rounded-full"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          {/* Play/Pause */}
          <Button
            size="icon"
            variant="default"
            onClick={state === "running" ? onPause : onPlay}
            disabled={state === "completed"}
            data-testid="button-play-pause"
            className="h-16 w-16 rounded-full"
          >
            {state === "running" ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>

          {/* Next */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onNext}
            disabled={!canGoNext}
            data-testid="button-next"
            className="h-12 w-12 rounded-full"
          >
            <SkipForward className="h-5 w-5" />
          </Button>

          {/* Reset */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onReset}
            data-testid="button-reset"
            className="h-12 w-12 rounded-full"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>

          {/* Audio Toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleAudio}
            data-testid="button-audio-toggle"
            className="h-12 w-12 rounded-full"
          >
            {audioEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>


          {/* Mobile controls separator - only show on mobile */}
          {(fullscreen?.isSupported || wakeLock?.isSupported) && (
            <div className="w-px h-6 bg-border md:hidden" />
          )}

          {/* Fullscreen Toggle - mobile only */}
          {fullscreen?.isSupported && (
            <Button
              size="icon"
              variant="ghost"
              onClick={fullscreen.toggleFullscreen}
              data-testid="button-fullscreen-toggle"
              className="h-12 w-12 rounded-full md:hidden"
            >
              {fullscreen.isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Wake Lock Toggle - mobile only */}
          {wakeLock?.isSupported && (
            <Button
              size="icon"
              variant={wakeLock.isActive ? "default" : "ghost"}
              onClick={wakeLock.isActive ? wakeLock.releaseWakeLock : wakeLock.requestWakeLock}
              data-testid="button-wake-lock-toggle"
              className="h-12 w-12 rounded-full md:hidden"
            >
              {wakeLock.isActive ? (
                <SmartphoneCharging className="h-4 w-4" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-center mt-4 text-xs text-muted-foreground">
        <div className="bg-background/60 backdrop-blur-sm rounded-full px-4 py-2">
          Space: Play/Pause • ← → : Previous/Next • R: Reset
        </div>
      </div>
    </div>
  );
}