import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { ClassPlan } from "@shared/timer-schema";

const COMPLEX_HIIT_WORKOUT = {
  "version": "1.0",
  "metadata": {
    "brand": "Generic HIIT",
    "class_name": "HIIT 30 Express",
    "duration_min": 30,
    "modality": "HIIT",
    "level": "Intermediate–Advanced",
    "attendees": "open",
    "stations": 1,
    "equipment": "None",
    "space": "Open floor, 6x6ft per person",
    "coach_tone": "High energy, concise cues",
    "music": "140–150 BPM, rolling peaks",
    "intensity_curve": "Rolling peaks → challenge → finisher"
  },
  "blocks": [
    {
      "id": "B1",
      "type": "WARMUP",
      "title": "Dynamic Preview",
      "duration_min": 3,
      "objective": "Elevate HR, prep key movement families",
      "format": {"rounds": 1, "work": "30s ×6"},
      "workflow": "Continuous",
      "exercises": [
        {"name": "Speed Squat", "equipment": "Bodyweight", "reps_or_time": "30s", "coaching_cues": ["chest tall","brace core"]},
        {"name": "Reverse Lunge", "equipment": "Bodyweight", "reps_or_time": "30s"},
        {"name": "Skater (light)", "equipment": "Bodyweight", "reps_or_time": "30s"},
        {"name": "Mountain Climber (light)", "equipment": "Bodyweight", "reps_or_time": "30s"},
        {"name": "Inchworm", "equipment": "Bodyweight", "reps_or_time": "30s"},
        {"name": "Jumping Jack", "equipment": "Bodyweight", "reps_or_time": "30s"}
      ],
      "transitions_sec": 15,
      "safety_notes": "Low-impact options available for jumps.",
      "scaling_notes": "Step jacks, slow climbers if needed.",
      "layout_notes": "All face front."
    },
    {
      "id": "B2",
      "type": "TABATA",
      "title": "Triplet",
      "duration_min": 4,
      "objective": "Early HR spike, balance tissues",
      "format": {"rounds": 9, "work": "20s", "rest": "10s"},
      "workflow": "Cycle Jump Squat → Push-up + Shoulder Tap → High Knee Run",
      "exercises": [
        {"name": "Jump Squat"},
        {"name": "Push-up + Shoulder Tap"},
        {"name": "High Knee Run"}
      ],
      "transitions_sec": 15
    },
    {
      "id": "B3",
      "type": "INTERVAL",
      "title": "Dropset",
      "duration_min": 5,
      "objective": "Complexity scales with time",
      "format": {"scheme": "40/20/10/10/20/40 with 15s rests"},
      "exercises": [{"name": "Burpee → Push-up → Jump"}],
      "safety_notes": "Remove jump for low impact"
    },
    {
      "id": "B4",
      "type": "INTERVAL",
      "title": "30/15 Engine",
      "duration_min": 6,
      "objective": "Sustained conditioning with variety",
      "format": {"rounds": 3, "work": "30s", "rest": "15s"},
      "exercises": [
        {"name": "Jumping Jacks"},
        {"name": "Bear Crawl / Taps"},
        {"name": "Donkey Kicks"},
        {"name": "Jumping Jack → Heel Click"}
      ]
    },
    {
      "id": "B5",
      "type": "EMOM",
      "title": "Alternating Formats",
      "duration_min": 5,
      "objective": "Variety & combo finale",
      "format": {"rounds": 5, "work": "1:00 AMRAP each"},
      "exercises": [
        {"name": "Format A: 6 Plank Jacks → 6 Hip Escapes → 6 Jumping Jacks"},
        {"name": "Format B: 6 Shuffles → 6 Side Jumps → 6 × 180° Turns"},
        {"name": "Format C: Combo Finale 3 reps each"}
      ]
    },
    {
      "id": "B6",
      "type": "CHALLENGE",
      "title": "2-Minute Burpee Test",
      "duration_min": 2,
      "objective": "Max effort, measurable",
      "format": {"work": "120s AMRAP", "rest": "30s"},
      "exercises": [{"name": "Burpee"}]
    },
    {
      "id": "B7",
      "type": "LADDER",
      "title": "Finisher Ladder",
      "duration_min": 4,
      "objective": "Competitive density & fatigue control",
      "format": {"scheme": "Skater ↔ Burpee climb then descend"},
      "exercises": [{"name": "Skater"},{"name": "Burpee"}]
    },
    {
      "id": "B8",
      "type": "COOLDOWN",
      "title": "Quick Flow",
      "duration_min": 1,
      "objective": "Downshift nervous system",
      "exercises": [
        {"name": "Child's Pose"},
        {"name": "Half-Kneeling Hip Flexor Stretch"},
        {"name": "Forward Fold"}
      ]
    }
  ],
  "equipment_setup": [],
  "time_audit": {"sum_min": 30, "buffer_min": 0}
};

interface LoadComplexWorkoutProps {
  onLoadPlan: (plan: ClassPlan) => void;
}

export default function LoadComplexWorkout({ onLoadPlan }: LoadComplexWorkoutProps) {
  const loadComplexWorkout = () => {
    // Use the existing JsonLoader validation and conversion logic
    const jsonLoader = document.querySelector('[data-testid="textarea-json-input"]') as HTMLTextAreaElement;
    if (jsonLoader) {
      // Set the JSON text and trigger the load
      const event = new Event('input', { bubbles: true });
      jsonLoader.value = JSON.stringify(COMPLEX_HIIT_WORKOUT, null, 2);
      jsonLoader.dispatchEvent(event);
      
      // Trigger the build program button
      setTimeout(() => {
        const buildButton = document.querySelector('[data-testid="button-build-program"]') as HTMLButtonElement;
        if (buildButton) {
          buildButton.click();
        }
      }, 100);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={loadComplexWorkout}
      data-testid="button-load-complex-hiit"
      className="gap-2"
    >
      <FileText className="h-4 w-4" />
      Load HIIT 30 Express
    </Button>
  );
}