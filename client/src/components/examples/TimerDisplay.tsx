import TimerDisplay from "../TimerDisplay";
import type { FlatInterval } from "@shared/timer-schema";

// Mock intervals for demo
const mockWorkInterval: FlatInterval = {
  id: "1",
  activity: "Burpees",
  duration: 45,
  blockType: "RANDOMIZED",
  blockName: "High Intensity",
  setNumber: 2,
  totalSets: 4,
  isRest: false,
};

const mockRestInterval: FlatInterval = {
  id: "2",
  activity: "REST",
  duration: 15,
  blockType: "RANDOMIZED", 
  blockName: "High Intensity",
  setNumber: 2,
  totalSets: 4,
  isRest: true,
};

const mockNextInterval: FlatInterval = {
  id: "3",
  activity: "Mountain Climbers",
  duration: 45,
  blockType: "RANDOMIZED",
  blockName: "High Intensity", 
  setNumber: 3,
  totalSets: 4,
  isRest: false,
};

export default function TimerDisplayExample() {
  return (
    <div className="h-screen">
      <TimerDisplay
        currentInterval={mockWorkInterval}
        timeRemaining={23}
        state="running"
        progress={0.6}
        nextInterval={mockNextInterval}
      />
    </div>
  );
}