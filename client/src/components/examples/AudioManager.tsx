import AudioManager from "../AudioManager";
import type { FlatInterval, AudioSettings } from "@shared/timer-schema";

const mockSettings: AudioSettings = {
  enableBeeps: true,
  enableVoice: true,
  beepVolume: 0.8,
  voiceVolume: 0.9,
};

const mockInterval: FlatInterval = {
  id: "1",
  activity: "Push-ups",
  duration: 30,
  blockType: "COMBO",
  blockName: "Strength Training",
  isRest: false,
};

export default function AudioManagerExample() {
  return (
    <div className="h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Audio Manager Demo</h1>
        <p className="text-muted-foreground">
          This component handles audio permissions and TTS/beep functionality
        </p>
        <div className="text-sm text-muted-foreground bg-card p-4 rounded-lg">
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Audio permission prompt</li>
            <li>Countdown beeps (3-2-1)</li>
            <li>Text-to-speech announcements</li>
            <li>Volume controls</li>
          </ul>
        </div>
      </div>

      <AudioManager
        settings={mockSettings}
        currentInterval={mockInterval}
        timeRemaining={25}
        isRunning={true}
        onIntervalChange={(interval) => console.log("Interval changed:", interval)}
      />
    </div>
  );
}