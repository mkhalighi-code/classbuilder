import { Maximize, Minimize, Smartphone, SmartphoneCharging } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileControlsProps {
  wakeLock: {
    isSupported: boolean;
    isActive: boolean;
    requestWakeLock: () => Promise<boolean>;
    releaseWakeLock: () => Promise<void>;
  };
  fullscreen: {
    isSupported: boolean;
    isFullscreen: boolean;
    toggleFullscreen: () => Promise<boolean>;
  };
  isTimerRunning: boolean;
}

export default function MobileControls({ wakeLock, fullscreen, isTimerRunning }: MobileControlsProps) {
  // Only show on mobile devices
  if (typeof window === 'undefined' || window.innerWidth > 768) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-background/90 backdrop-blur-sm border-b px-4 py-2 md:hidden">
      <div className="flex items-center gap-2">
        {/* Wake lock status */}
        {wakeLock.isSupported && (
          <Badge 
            variant={wakeLock.isActive ? "default" : "secondary"}
            className="text-xs gap-1"
          >
            {wakeLock.isActive ? (
              <SmartphoneCharging className="h-3 w-3" />
            ) : (
              <Smartphone className="h-3 w-3" />
            )}
            {wakeLock.isActive ? "Screen On" : "Screen Lock"}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Fullscreen toggle */}
        {fullscreen.isSupported && (
          <Button
            size="sm"
            variant="ghost"
            onClick={fullscreen.toggleFullscreen}
            data-testid="button-fullscreen-toggle"
            className="gap-2"
          >
            {fullscreen.isFullscreen ? (
              <>
                <Minimize className="h-4 w-4" />
                Exit
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4" />
                Fullscreen
              </>
            )}
          </Button>
        )}

        {/* Wake lock toggle */}
        {wakeLock.isSupported && (
          <Button
            size="sm"
            variant={wakeLock.isActive ? "default" : "outline"}
            onClick={wakeLock.isActive ? wakeLock.releaseWakeLock : wakeLock.requestWakeLock}
            data-testid="button-wake-lock-toggle"
            className="text-xs"
          >
            {wakeLock.isActive ? "Release" : "Stay Awake"}
          </Button>
        )}
      </div>
    </div>
  );
}