import type { ClassPlan, ClassBlock, FlatInterval } from "./timer-schema";

// Flatten class plan into linear list of intervals
export function flattenClassPlan(plan: ClassPlan): FlatInterval[] {
  const intervals: FlatInterval[] = [];
  let globalId = 0;

  plan.blocks.forEach((block) => {
    const repeats = block.repeat || 1;
    
    for (let setIndex = 0; setIndex < repeats; setIndex++) {
      // Add timeline intervals
      block.timeline.forEach((item) => {
        intervals.push({
          id: `interval-${globalId++}`,
          activity: item.activity,
          duration: item.time,
          blockType: block.type || "default",
          blockName: block.name,
          setNumber: repeats > 1 ? setIndex + 1 : undefined,
          totalSets: repeats > 1 ? repeats : undefined,
          isRest: item.activity.toLowerCase().includes("rest"),
        });
      });

      // Add rest between sets (except after last set)
      if (setIndex < repeats - 1 && block.rest_between_sets && block.rest_between_sets > 0) {
        intervals.push({
          id: `interval-${globalId++}`,
          activity: "REST",
          duration: block.rest_between_sets,
          blockType: block.type || "default",
          blockName: block.name,
          setNumber: setIndex + 1,
          totalSets: repeats,
          isRest: true,
        });
      }
    }
  });

  return intervals;
}

// Calculate total duration of class plan
export function calculateTotalDuration(plan: ClassPlan): number {
  return flattenClassPlan(plan).reduce((total, interval) => total + interval.duration, 0);
}

// Format time as MM:SS
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Sample class plan for demo
export const SAMPLE_CLASS_PLAN: ClassPlan = {
  class_name: "HIIT Workout",
  blocks: [
    {
      name: "Warm-up",
      type: "WARMUP",
      timeline: [
        { time: 30, activity: "Jumping Jacks" },
        { time: 30, activity: "Arm Circles" },
      ],
    },
    {
      name: "High Intensity",
      type: "RANDOMIZED", 
      timeline: [
        { time: 20, activity: "Burpees" },
        { time: 10, activity: "REST" },
      ],
      repeat: 4,
      rest_between_sets: 30,
    },
    {
      name: "Cool Down",
      type: "COOLDOWN",
      timeline: [
        { time: 60, activity: "Stretching" },
      ],
    },
  ],
};