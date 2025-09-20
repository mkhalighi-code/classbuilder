import type { ClassPlanV1 } from "./class-plan-v1";

export const SAMPLE_5_MIN: ClassPlanV1 = {
  class_name: "Quick 5",
  duration_min: 5,
  blocks: [
    {
      id: "w1",
      title: "Warm-Up",
      objective: "Prime movement",
      format: { rounds: 1 },
      intervals: [
        { type: "work", label: "Mobility Flow", seconds: 120 },
        { type: "transition", label: "Set Up", seconds: 15 },
        { type: "work", label: "Jumping Jacks", seconds: 45 },
      ],
    },
  ],
};

export const SAMPLE_30_MIN: ClassPlanV1 = {
  class_name: "HIIT 30",
  duration_min: 30,
  blocks: [
    {
      id: "b1",
      title: "EMOM Strength",
      objective: "Lower body",
      format: { rounds: 5 },
      intervals: [
        { type: "work", label: "Back Squats", seconds: 40 },
        { type: "rest", label: "Rest", seconds: 20 },
      ],
    },
    {
      id: "c1",
      title: "Core",
      objective: "Anti-rotation",
      format: { rounds: 2 },
      intervals: [
        { type: "work", label: "Plank", seconds: 60 },
        { type: "rest", label: "Rest", seconds: 20 },
        { type: "work", label: "Dead Bug", seconds: 40 },
      ],
    },
  ],
};

export const SAMPLE_45_MIN: ClassPlanV1 = {
  class_name: "Full Class 45",
  duration_min: 45,
  blocks: [
    {
      id: "w1",
      title: "Warm-Up",
      objective: "Prime movement",
      format: { rounds: 1 },
      intervals: [
        { type: "work", label: "Mobility Flow", seconds: 180 },
        { type: "transition", label: "Set Up", seconds: 15 },
      ],
    },
    {
      id: "b1",
      title: "EMOM Strength",
      objective: "Lower body",
      format: { rounds: 5 },
      intervals: [
        { type: "work", label: "Back Squats", seconds: 40 },
        { type: "rest", label: "Rest", seconds: 20 },
      ],
    },
    {
      id: "fin",
      title: "Finisher",
      objective: "Spike heart rate",
      format: { rounds: 4 },
      intervals: [
        { type: "work", label: "Burpees", seconds: 20 },
        { type: "rest", label: "Rest", seconds: 10 },
      ],
    },
  ],
};
