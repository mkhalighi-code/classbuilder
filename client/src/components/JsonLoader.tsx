import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FileText, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { classPlanSchema } from "@shared/timer-schema";
import type { ClassPlan } from "@shared/timer-schema";
import { SAMPLE_CLASS_PLAN } from "@shared/timer-utils";
import { convertComplexWorkout, isComplexWorkoutFormat } from "@/utils/workoutConverter";

interface JsonLoaderProps {
  onLoadPlan: (plan: ClassPlan) => void;
  trigger?: React.ReactNode;
}

export default function JsonLoader({ onLoadPlan, trigger }: JsonLoaderProps) {
  const [jsonText, setJsonText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAndLoad = async () => {
    setIsValidating(true);
    setError(null);

    try {
      if (!jsonText.trim()) {
        throw new Error("Please enter a workout plan in JSON format.");
      }

      // Parse JSON with better error messages
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (syntaxErr) {
        if (syntaxErr instanceof SyntaxError) {
          const message = syntaxErr.message;
          if (message.includes("Unexpected token")) {
            throw new Error("JSON syntax error: Check for missing commas, quotes, or brackets. " + message);
          } else if (message.includes("Unexpected end")) {
            throw new Error("JSON incomplete: Missing closing brackets or quotes.");
          } else {
            throw new Error("Invalid JSON format: " + message);
          }
        }
        throw syntaxErr;
      }
      
      // Basic structure validation before Zod
      if (!parsed || typeof parsed !== 'object') {
        throw new Error("Workout plan must be a valid JSON object.");
      }

      if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
        throw new Error("Workout plan must have a 'blocks' array containing workout intervals.");
      }

      if (parsed.blocks.length === 0) {
        throw new Error("Workout plan must have at least one block with exercises.");
      }

      // Check if this is a complex format and convert it
      let workoutPlan = parsed;
      if (isComplexWorkoutFormat(parsed)) {
        console.log("Complex format detected, converting...", parsed);
        try {
          workoutPlan = convertComplexWorkout(parsed);
          console.log("Converted workout plan:", workoutPlan);
        } catch (conversionError) {
          console.error("Conversion error:", conversionError);
          throw new Error(`Failed to convert complex workout format: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`);
        }
      }

      // Check for common mistakes in the final format
      for (let i = 0; i < workoutPlan.blocks.length; i++) {
        const block = workoutPlan.blocks[i];
        if (!block.name || typeof block.name !== 'string') {
          throw new Error(`Block ${i + 1} is missing a 'name' field.`);
        }
        if (!block.timeline || !Array.isArray(block.timeline)) {
          throw new Error(`Block "${block.name}" is missing a 'timeline' array.`);
        }
        if (block.timeline.length === 0) {
          throw new Error(`Block "${block.name}" has no exercises in its timeline.`);
        }

        // Check timeline items
        block.timeline.forEach((item: any, j: number) => {
          if (!item.time || typeof item.time !== 'number' || item.time <= 0) {
            throw new Error(`Block "${block.name}", exercise ${j + 1}: 'time' must be a positive number (seconds).`);
          }
          if (!item.activity || typeof item.activity !== 'string') {
            throw new Error(`Block "${block.name}", exercise ${j + 1}: 'activity' must be a non-empty string.`);
          }
        });

        // Check optional fields
        if (block.repeat !== undefined && (typeof block.repeat !== 'number' || block.repeat < 1)) {
          throw new Error(`Block "${block.name}": 'repeat' must be a positive number if specified.`);
        }
        if (block.rest_between_sets !== undefined && (typeof block.rest_between_sets !== 'number' || block.rest_between_sets < 0)) {
          throw new Error(`Block "${block.name}": 'rest_between_sets' must be a non-negative number if specified.`);
        }
      }
      
      // Final Zod validation
      const validPlan = classPlanSchema.parse(workoutPlan);
      
      // Calculate total time for feedback
      const totalMinutes = Math.ceil(
        validPlan.blocks.reduce((total, block) => {
          const blockTime = block.timeline.reduce((sum, item) => sum + item.time, 0);
          const repeats = block.repeat || 1;
          const restTime = block.rest_between_sets ? (repeats - 1) * block.rest_between_sets : 0;
          return total + (blockTime * repeats) + restTime;
        }, 0) / 60
      );
      
      // Load the plan
      onLoadPlan(validPlan);
      setIsOpen(false);
      setJsonText("");
      console.log("Loaded workout plan:", validPlan);
      
    } catch (err) {
      console.error("Validation error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred while loading the plan.");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const loadSamplePlan = () => {
    setJsonText(JSON.stringify(SAMPLE_CLASS_PLAN, null, 2));
    setError(null);
  };

  const loadComplexHiitPlan = () => {
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
    
    setJsonText(JSON.stringify(COMPLEX_HIIT_WORKOUT, null, 2));
    setError(null);
  };

  const defaultTrigger = (
    <Button data-testid="button-load-json" className="gap-2">
      <FileText className="h-4 w-4" />
      Load Workout Plan
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Load Workout Plan
          </DialogTitle>
          <DialogDescription>
            Paste your JSON workout plan below. The plan will be validated before loading.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Quick actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">JSON Format</Badge>
              <span className="text-sm text-muted-foreground">
                Use the sample plan as a template
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSamplePlan}
                data-testid="button-load-sample"
              >
                Load Sample Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadComplexHiitPlan}
                data-testid="button-load-complex-hiit"
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Load HIIT 30 Express
              </Button>
            </div>
          </div>

          {/* JSON textarea */}
          <div className="flex-1 min-h-0">
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste your JSON workout plan here..."
              className="h-full min-h-[300px] font-mono text-sm resize-none"
              data-testid="textarea-json-input"
            />
          </div>

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Format help and validation hints */}
          {!jsonText ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Expected format:</strong> JSON with "blocks" array containing:</p>
                  <ul className="list-disc list-inside text-sm ml-4 space-y-1">
                    <li><strong>name:</strong> Block name (string)</li>
                    <li><strong>timeline:</strong> Array of exercises with "time" (seconds) and "activity" (name)</li>
                    <li><strong>type:</strong> Optional block type (WARMUP, COMBO, PYRAMID, etc.)</li>
                    <li><strong>repeat:</strong> Optional number of times to repeat the block</li>
                    <li><strong>rest_between_sets:</strong> Optional rest seconds between repeats</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          ) : jsonText.length > 10 && !error && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                JSON looks valid! Click "Build Program" to load your workout.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={validateAndLoad}
              disabled={!jsonText.trim() || isValidating}
              data-testid="button-build-program"
              className="gap-2"
            >
              {isValidating ? (
                "Validating..."
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Build Program
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}