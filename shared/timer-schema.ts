import { z } from "zod";

// Core timer types based on the requirements
export type TimelineItem = {
  time: number;
  activity: string;
};

export type BlockType = 
  | "WARMUP" 
  | "COMBO" 
  | "PYRAMID" 
  | "RANDOMIZED" 
  | "LADDER" 
  | "COOLDOWN" 
  | string;

export type ClassBlock = {
  name: string;
  type?: BlockType;
  timeline: TimelineItem[];
  repeat?: number;
  rest_between_sets?: number;
  notes?: string;
};

export type ClassPlan = {
  class_name?: string;
  total_duration?: string | number;
  blocks: ClassBlock[];
};

// Flattened interval for timer execution
export type FlatInterval = {
  id: string;
  activity: string;
  duration: number;
  blockType: BlockType;
  blockName: string;
  setNumber?: number;
  totalSets?: number;
  isRest: boolean;
  notes?: string;
};

// Zod schemas for validation
export const timelineItemSchema = z.object({
  time: z.number().min(1, "Time must be at least 1 second"),
  activity: z.string().min(1, "Activity name is required"),
});

export const classBlockSchema = z.object({
  name: z.string().min(1, "Block name is required"),
  type: z.string().optional(),
  timeline: z.array(timelineItemSchema).min(1, "At least one timeline item required"),
  repeat: z.number().min(1).optional(),
  rest_between_sets: z.number().min(0).optional(),
});

export const classPlanSchema = z.object({
  class_name: z.string().optional(),
  total_duration: z.union([z.string(), z.number()]).optional(),
  blocks: z.array(classBlockSchema).min(1, "At least one block is required"),
});

// Timer states
export type TimerState = "idle" | "running" | "paused" | "completed";

// Audio settings
export type AudioSettings = {
  enableBeeps: boolean;
  enableVoice: boolean;
  enableStartBeep: boolean;
  enableEndBeep: boolean;
  enableLastThreeBeep: boolean;
  musicVolume: number;
  voiceVolume: number;
  beepVolume: number;
  enableMetronome: boolean;
  metronomeBPM: number;
};

// Instructor settings
export type InstructorSettings = {
  showPreStartModal: boolean;
  lockControls: boolean;
  showElapsedTime: boolean;
  showRemainingTime: boolean;
};

// Block type base colors - distinct colors for different workout blocks
export const BLOCK_COLORS: Record<string, string> = {
  WARMUP: "timer-prep",       // Teal for prep/warmup
  TABATA: "timer-tabata",     // Red for tabata
  INTERVAL: "timer-interval", // Purple for interval training
  EMOM: "timer-emom",         // Orange for EMOM
  CHALLENGE: "timer-challenge", // Pink for challenges
  LADDER: "timer-ladder",     // Indigo for ladder workouts
  COMBO: "timer-combo",       // Yellow for combo exercises
  PYRAMID: "timer-pyramid",   // Cyan for pyramid workouts
  RANDOMIZED: "timer-randomized", // Lime for randomized workouts
  COOLDOWN: "timer-cooldown", // Blue for cooldown
  default: "timer-default",   // Gray for other intervals
};

// Activity-specific colors for visual tracking within blocks
export const ACTIVITY_COLORS: Record<string, string> = {
  // Core movements
  "burpees": "timer-burpee",
  "burpee": "timer-burpee", 
  "jump squat": "timer-jump-squat",
  "jumping jacks": "timer-jumping-jacks",
  "mountain climber": "timer-mountain-climber",
  "plank": "timer-plank",
  "push-up": "timer-pushup",
  "squat": "timer-squat",
  "lunge": "timer-lunge",
  
  // Cardio
  "high knee run": "timer-cardio",
  "high knees": "timer-cardio",
  "running": "timer-cardio",
  "skater": "timer-cardio",
  "bear crawl": "timer-cardio",
  
  // Strength
  "deadlift": "timer-strength",
  "press": "timer-strength",
  "row": "timer-strength",
  "pull": "timer-strength",
  
  // Stretching/recovery
  "stretch": "timer-stretch",
  "child's pose": "timer-stretch",
  "forward fold": "timer-stretch",
  "hip flexor": "timer-stretch",
  
  // Generic activity fallbacks for other exercises
  "arm circles": "timer-mobility",
  "inchworm": "timer-mobility",
};

// Status dot colors for outline
export const STATUS_DOT_COLORS: Record<string, string> = {
  'timer-work': 'bg-red-500',
  'timer-rest': 'bg-green-500',  // Changed from amber to green per requirements
  'timer-prep': 'bg-teal-500',
  'timer-tabata': 'bg-red-600',
  'timer-interval': 'bg-purple-500',
  'timer-emom': 'bg-orange-500',
  'timer-challenge': 'bg-pink-500',
  'timer-ladder': 'bg-indigo-500',
  'timer-combo': 'bg-yellow-500',
  'timer-pyramid': 'bg-cyan-500',
  'timer-randomized': 'bg-lime-500',
  'timer-cooldown': 'bg-blue-500',
  'timer-default': 'bg-gray-500',
  
  // Activity-specific colors
  'timer-burpee': 'bg-red-700',
  'timer-jump-squat': 'bg-red-500',
  'timer-jumping-jacks': 'bg-orange-600',
  'timer-mountain-climber': 'bg-yellow-600',
  'timer-plank': 'bg-blue-600',
  'timer-pushup': 'bg-purple-600',
  'timer-squat': 'bg-green-600',
  'timer-lunge': 'bg-teal-600',
  'timer-cardio': 'bg-pink-600',
  'timer-strength': 'bg-gray-700',
  'timer-stretch': 'bg-emerald-400',
  'timer-mobility': 'bg-sky-500',
};

// Get activity-specific color key from activity name
function getActivityColorKey(activity: string): string | null {
  const activityLower = activity.toLowerCase();
  
  // Direct match
  if (ACTIVITY_COLORS[activityLower]) {
    return ACTIVITY_COLORS[activityLower];
  }
  
  // Partial matches for compound exercise names
  for (const [key, colorClass] of Object.entries(ACTIVITY_COLORS)) {
    if (activityLower.includes(key)) {
      return colorClass;
    }
  }
  
  return null;
}

// Get color for interval - REST = green, activities = activity-specific, fallback to block color
export function getIntervalColor(interval: FlatInterval): string {
  // Always green for rest intervals
  if (interval.isRest) return "timer-rest";
  
  // Try activity-specific color first
  const activityColor = getActivityColorKey(interval.activity);
  if (activityColor) {
    return activityColor;
  }
  
  // Fallback to block type color
  return BLOCK_COLORS[interval.blockType] || BLOCK_COLORS.default;
}

// Get status dot color for interval
export function getStatusDotColor(interval: FlatInterval): string {
  const colorClass = getIntervalColor(interval);
  return STATUS_DOT_COLORS[colorClass] || STATUS_DOT_COLORS['timer-default'];
}

// Format voice cue according to grammar requirements
export function formatVoiceCue(interval: FlatInterval, isStart: boolean): string {
  if (isStart) {
    if (interval.isRest) {
      return `Rest — ${interval.duration} seconds`;
    } else {
      return `Go — ${interval.activity} — ${interval.duration} seconds`;
    }
  } else {
    // End of interval
    if (interval.isRest) {
      return `Rest — ${interval.duration} seconds`;
    } else {
      return `${interval.activity} — ${interval.duration} seconds`;
    }
  }
}

// Format up next voice cue
export function formatUpNextCue(interval: FlatInterval): string {
  if (interval.isRest) {
    return `Up next: Rest`;
  } else {
    return `Up next: ${interval.activity}`;
  }
}