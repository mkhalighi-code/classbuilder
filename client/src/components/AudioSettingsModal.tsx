import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Volume2, VolumeX, Music, Mic, Bell, Timer } from "lucide-react";
import type { AudioSettings } from "@shared/timer-schema";

interface AudioSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AudioSettings;
  onSettingsChange: (settings: AudioSettings) => void;
}

export default function AudioSettingsModal({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: AudioSettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AudioSettings>(settings);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const updateSetting = <K extends keyof AudioSettings>(
    key: K,
    value: AudioSettings[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const playTestBeep = () => {
    // Create a short beep sound for testing
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(localSettings.beepVolume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playTestVoice = () => {
    // Test voice with Speech Synthesis API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("Go — Jump Squat — 20 seconds");
      utterance.volume = localSettings.voiceVolume;
      utterance.rate = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="modal-audio-settings">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Beep Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Beeps
            </Label>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="start-beep"
                  checked={localSettings.enableStartBeep}
                  onCheckedChange={(checked) => updateSetting('enableStartBeep', !!checked)}
                  data-testid="checkbox-start-beep"
                />
                <Label htmlFor="start-beep" className="text-sm">Start of interval</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="last-three-beep"
                  checked={localSettings.enableLastThreeBeep}
                  onCheckedChange={(checked) => updateSetting('enableLastThreeBeep', !!checked)}
                  data-testid="checkbox-last-three-beep"
                />
                <Label htmlFor="last-three-beep" className="text-sm">Last 3 seconds countdown</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="end-beep"
                  checked={localSettings.enableEndBeep}
                  onCheckedChange={(checked) => updateSetting('enableEndBeep', !!checked)}
                  data-testid="checkbox-end-beep"
                />
                <Label htmlFor="end-beep" className="text-sm">End of interval</Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Voice Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="voice-over"
                checked={localSettings.enableVoice}
                onCheckedChange={(checked) => updateSetting('enableVoice', !!checked)}
                data-testid="checkbox-voice-over"
              />
              <Label htmlFor="voice-over" className="text-base font-medium flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice announcements
              </Label>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              "Go — Jump Squat — 20 seconds" / "Rest — 10 seconds"
            </p>
          </div>

          <Separator />

          {/* Volume Controls */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Volume Mix</Label>
            
            <div className="space-y-4">
              {/* Music Volume */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  <Label className="text-sm">Music</Label>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {Math.round(localSettings.musicVolume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[localSettings.musicVolume]}
                  onValueChange={([value]) => updateSetting('musicVolume', value)}
                  max={1}
                  step={0.1}
                  data-testid="slider-music-volume"
                />
              </div>

              {/* Voice Volume */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  <Label className="text-sm">Voice</Label>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {Math.round(localSettings.voiceVolume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[localSettings.voiceVolume]}
                  onValueChange={([value]) => updateSetting('voiceVolume', value)}
                  max={1}
                  step={0.1}
                  data-testid="slider-voice-volume"
                />
              </div>

              {/* Beep Volume */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label className="text-sm">Beeps</Label>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {Math.round(localSettings.beepVolume * 100)}%
                  </span>
                </div>
                <Slider
                  value={[localSettings.beepVolume]}
                  onValueChange={([value]) => updateSetting('beepVolume', value)}
                  max={1}
                  step={0.1}
                  data-testid="slider-beep-volume"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Metronome */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="metronome"
                checked={localSettings.enableMetronome}
                onCheckedChange={(checked) => updateSetting('enableMetronome', !!checked)}
                data-testid="checkbox-metronome"
              />
              <Label htmlFor="metronome" className="text-base font-medium flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Metronome (for tempo drills)
              </Label>
            </div>
            
            {localSettings.enableMetronome && (
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">BPM</Label>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {localSettings.metronomeBPM}
                  </span>
                </div>
                <Slider
                  value={[localSettings.metronomeBPM]}
                  onValueChange={([value]) => updateSetting('metronomeBPM', value)}
                  min={60}
                  max={180}
                  step={5}
                  data-testid="slider-metronome-bpm"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Test Buttons */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Test Audio</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={playTestBeep}
                data-testid="button-test-beep"
              >
                <Bell className="h-4 w-4 mr-2" />
                Test Beep
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={playTestVoice}
                data-testid="button-test-voice"
              >
                <Mic className="h-4 w-4 mr-2" />
                Test Voice
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}