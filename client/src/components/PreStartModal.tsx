import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Users, Volume2, Settings, Play, FileText, AlertCircle } from "lucide-react";
import { formatTime } from "@shared/timer-utils";
import { classPlanSchema } from "@shared/timer-schema";
import { isComplexWorkoutFormat, convertComplexWorkout } from "@/utils/workoutConverter";
import type { ClassPlan, AudioSettings } from "@shared/timer-schema";
import { useState } from "react";

interface PreStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classPlan: ClassPlan | null;
  totalDuration: number;
  intervalCount: number;
  audioSettings: AudioSettings;
  onStart: () => void;
  onEditSettings: () => void;
  onLoadPlan: (plan: ClassPlan) => void;
}

export default function PreStartModal({
  open,
  onOpenChange,
  classPlan,
  totalDuration,
  intervalCount,
  audioSettings,
  onStart,
  onEditSettings,
  onLoadPlan,
}: PreStartModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const getAudioSummary = () => {
    const features = [];
    if (audioSettings.enableStartBeep || audioSettings.enableEndBeep || audioSettings.enableLastThreeBeep) {
      features.push("Beeps");
    }
    if (audioSettings.enableVoice) {
      features.push("Voice");
    }
    if (audioSettings.enableMetronome) {
      features.push(`Metronome (${audioSettings.metronomeBPM} BPM)`);
    }
    return features.length > 0 ? features.join(", ") : "Audio disabled";
  };

  const getRestSummary = () => {
    if (!classPlan) {
      return { blockRests: "None", setInfo: "No repeated sets" };
    }

    const blockRests = classPlan.blocks
      .filter(block => block.rest_between_sets && block.rest_between_sets > 0)
      .map(block => `${formatTime(block.rest_between_sets!)}`);
    
    const setRests = classPlan.blocks
      .filter(block => block.repeat && block.repeat > 1)
      .map(block => `${block.name}: ${block.repeat} sets`);

    return {
      blockRests: blockRests.length > 0 ? blockRests.join(", ") : "None",
      setInfo: setRests.length > 0 ? setRests.join(", ") : "No repeated sets"
    };
  };

  const restSummary = getRestSummary();

  const validateAndLoadJSON = async () => {
    if (!jsonText.trim()) {
      setError("Please enter a JSON workout plan.");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Parse JSON
      const parsed = JSON.parse(jsonText);
      
      // Handle complex format conversion
      let workoutPlan = parsed;
      if (isComplexWorkoutFormat(parsed)) {
        try {
          workoutPlan = convertComplexWorkout(parsed);
        } catch (conversionError) {
          throw new Error(`Failed to convert complex workout format: ${conversionError instanceof Error ? conversionError.message : 'Unknown conversion error'}`);
        }
      }

      // Validate structure
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
      
      // Load the plan
      onLoadPlan(validPlan);
      setJsonText("");
      setError(null);
      
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

  const loadComplexHiitPlan = () => {
    const COMPLEX_HIIT_WORKOUT = {
      "version": "1.0",
      "metadata": {
        "brand": "Generic HIIT",
        "class_name": "HIIT 30 Express",
        "duration_min": 30,
        "modality": "HIIT",
        "level": "Intermediate–Advanced"
      },
      "blocks": [
        {
          "id": "B1",
          "type": "WARMUP",
          "title": "Dynamic Preview",
          "duration_min": 3,
          "format": {"rounds": 1, "work": "30s ×6"},
          "exercises": [
            {"name": "Speed Squat", "reps_or_time": "30s"},
            {"name": "Reverse Lunge", "reps_or_time": "30s"},
            {"name": "Skater (light)", "reps_or_time": "30s"},
            {"name": "Mountain Climber (light)", "reps_or_time": "30s"},
            {"name": "Inchworm", "reps_or_time": "30s"},
            {"name": "Jumping Jack", "reps_or_time": "30s"}
          ]
        },
        {
          "id": "B2",
          "type": "TABATA",
          "title": "Triplet",
          "duration_min": 4,
          "format": {"rounds": 9, "work": "20s", "rest": "10s"},
          "exercises": [
            {"name": "Jump Squat"},
            {"name": "Push-up + Shoulder Tap"},
            {"name": "High Knee Run"}
          ]
        }
      ]
    };
    
    setJsonText(JSON.stringify(COMPLEX_HIIT_WORKOUT, null, 2));
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-pre-start">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            {classPlan ? "Ready to Start?" : "Load Workout Plan"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={classPlan ? "summary" : "json"} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary" disabled={!classPlan}>Workout Summary</TabsTrigger>
            <TabsTrigger value="json">JSON Input</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {classPlan && (
              <div className="space-y-4">
                {/* Workout Summary */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">{classPlan.class_name || "Workout Session"}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>{formatTime(totalDuration)}</strong> total
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>{intervalCount}</strong> intervals
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Blocks Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Blocks</h4>
                  <div className="space-y-1">
                    {classPlan.blocks.map((block, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{block.name}</span>
                        <div className="flex items-center gap-2">
                          {block.repeat && block.repeat > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {block.repeat}x
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {block.type || "CUSTOM"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Rest Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Rest Periods</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Block rest: {restSummary.blockRests}</div>
                    <div>Sets: {restSummary.setInfo}</div>
                  </div>
                </div>

                <Separator />

                {/* Audio Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Audio Settings
                  </h4>
                  <p className="text-sm text-muted-foreground">{getAudioSummary()}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-4">
              {/* Quick actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">JSON Format</Badge>
                  <span className="text-sm text-muted-foreground">
                    Paste your workout plan here
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadComplexHiitPlan}
                  data-testid="button-load-sample-json"
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Load Sample
                </Button>
              </div>

              {/* JSON textarea */}
              <div className="space-y-2">
                <Textarea
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="Paste your JSON workout plan here..."
                  className="min-h-[200px] font-mono text-sm"
                  data-testid="textarea-json-input-modal"
                />
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <Button
                onClick={validateAndLoadJSON}
                disabled={isValidating || !jsonText.trim()}
                data-testid="button-build-program-modal"
                className="w-full gap-2"
              >
                <FileText className="h-4 w-4" />
                {isValidating ? "Building Program..." : "Build Program"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          {classPlan && (
            <>
              <Button
                variant="outline"
                onClick={onEditSettings}
                data-testid="button-edit-settings"
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Edit Settings
              </Button>
              <Button
                onClick={onStart}
                data-testid="button-start-workout"
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Start Workout
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}