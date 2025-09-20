// Test fixture for the HIIT 30 complex format
export const HIIT_30_COMPLEX = {
  "version": "1.0",
  "metadata": {
    "brand": "Default",
    "class_name": "HIIT 30",
    "duration_min": 30,
    "modality": "HIIT",
    "level": "Intermediate–Advanced",
    "attendees": "open",
    "stations": 1,
    "equipment": ["bodyweight"],
    "space": "general group floor",
    "coach_tone": "gritty, concise, motivational",
    "music": "140–160 BPM, driving",
    "intensity_curve": "rolling peaks → EMOM → measurable finish"
  },
  "blocks": [
    {
      "id": "B1",
      "type": "WARMUP",
      "title": "Dynamic Prep",
      "duration_min": 3,
      "objective": "Elevate HR, mobilize, preview core patterns",
      "format": {"rounds": 1, "work": "30s × 6"},
      "exercises": [
        {"name": "Speed Squat", "equipment": "bodyweight", "reps_or_time": "30s"},
        {"name": "Butt Kicks", "equipment": "bodyweight", "reps_or_time": "30s"},
        {"name": "Inchworm", "equipment": "bodyweight", "reps_or_time": "30s"}
      ],
      "transitions_sec": 15,
      "safety_notes": "Encourage low-impact options; brace core before impact.",
      "scaling_notes": "Step jacks, slow climbers.",
      "layout_notes": "Keep athletes spread for lateral moves."
    },
    {
      "id": "B2",
      "type": "TABATA",
      "title": "Tabata Triplet",
      "duration_min": 4,
      "objective": "Early HR spike with balanced tissues",
      "format": {"rounds": 2, "work": "20s", "rest": "10s"},
      "exercises": [
        {"name": "Jump Squat", "equipment": "bodyweight", "reps_or_time": "20s"},
        {"name": "Push-up + Shoulder Tap", "equipment": "bodyweight", "reps_or_time": "20s"}
      ],
      "transitions_sec": 20,
      "safety_notes": "Quiet landings, shoulders stacked.",
      "scaling_notes": "Air squat, knee push-up, march-in-place."
    },
    {
      "id": "B3",
      "type": "RANDOMIZED",
      "title": "High Intensity Block",
      "duration_min": 7,
      "objective": "Sustained engine with varied stressors",
      "format": {"rounds": 4, "work": "30s", "rest": "15s"},
      "exercises": [
        {"name": "Burpees", "equipment": "bodyweight", "reps_or_time": "30s"},
        {"name": "Mountain Climbers", "equipment": "bodyweight", "reps_or_time": "30s"}
      ],
      "transitions_sec": 60,
      "safety_notes": "Quiet feet, ribs down in crawl.",
      "scaling_notes": "Step jacks, crawl steps, calf pop instead of heel click."
    },
    {
      "id": "B4",
      "type": "COOLDOWN",
      "title": "Cooldown Flow",
      "duration_min": 3,
      "objective": "Recover, restore mobility",
      "format": {"rounds": 1, "work": "30s × 4"},
      "exercises": [
        {"name": "Child's Pose", "equipment": "bodyweight", "reps_or_time": "30s"},
        {"name": "Cat–Cow", "equipment": "bodyweight", "reps_or_time": "30s"},
        {"name": "Forward Fold", "equipment": "bodyweight", "reps_or_time": "30s"}
      ],
      "transitions_sec": 0,
      "safety_notes": "All ranges pain-free; hinge from hips.",
      "scaling_notes": "Figure-4 instead of Pigeon; strap for hamstrings."
    }
  ],
  "equipment_setup": ["No equipment; open space"],
  "time_audit": {"sum_min": 30, "buffer_min": 0}
};

// Test the conversion
import { convertComplexWorkout } from './workoutConverter';

export function testComplexConversion() {
  console.log("Testing HIIT 30 complex format conversion...");
  try {
    const converted = convertComplexWorkout(HIIT_30_COMPLEX);
    console.log("Conversion successful:", converted);
    return converted;
  } catch (error) {
    console.error("Conversion failed:", error);
    return null;
  }
}