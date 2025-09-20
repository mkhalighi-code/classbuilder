import type { ClassPlan } from "@shared/timer-schema";

// Complex workout format types
interface ComplexWorkoutExercise {
  name: string;
  equipment?: string;
  reps_or_time?: string;
  coaching_cues?: string[];
}

interface ComplexWorkoutBlock {
  id: string;
  type: string;
  title: string;
  duration_min: number;
  objective?: string;
  format?: {
    rounds?: number;
    work?: string;
    rest?: string;
    intervals?: string;
    scheme?: string;
  };
  exercises: ComplexWorkoutExercise[];
  transitions_sec?: number;
  safety_notes?: string;
  scaling_notes?: string;
}

interface ComplexWorkoutFormat {
  version?: string;
  metadata?: {
    brand?: string;
    class_name?: string;
    duration_min?: number;
    modality?: string;
    level?: string;
    attendees?: string;
    stations?: number;
    equipment?: string[];
    space?: string;
    coach_tone?: string;
    music?: string;
    intensity_curve?: string;
  };
  blocks: ComplexWorkoutBlock[];
  equipment_setup?: string[];
  time_audit?: {
    sum_min?: number;
    buffer_min?: number;
  };
}

// Parse time string like "30s", "2:00", "20s", etc.
function parseTimeString(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  // Handle formats like "30s"
  if (timeStr.endsWith('s')) {
    const seconds = parseInt(timeStr.slice(0, -1));
    return isNaN(seconds) ? 0 : seconds;
  }
  
  // Handle formats like "2:00" (minutes:seconds)
  if (timeStr.includes(':')) {
    const [mins, secs] = timeStr.split(':').map(s => parseInt(s) || 0);
    return (mins * 60) + secs;
  }
  
  // Handle just numbers (assume seconds)
  const num = parseInt(timeStr);
  return isNaN(num) ? 0 : num;
}

// Extract work and rest times from format strings
function parseWorkRestFormat(formatStr: string): { work: number; rest: number } {
  // Handle formats like "30s / 15s", "20s work / 10s rest", etc.
  const parts = formatStr.split('/').map(s => s.trim());
  if (parts.length >= 2) {
    return {
      work: parseTimeString(parts[0].replace(/work|×|\d+$/gi, '').trim()),
      rest: parseTimeString(parts[1].replace(/rest/gi, '').trim())
    };
  }
  
  // Single time value - assume all work
  return {
    work: parseTimeString(formatStr.replace(/×|\d+$/gi, '').trim()),
    rest: 0
  };
}

// Convert complex format to simple format
export function convertComplexWorkout(complexWorkout: any): ClassPlan {
  const workout = complexWorkout as ComplexWorkoutFormat;
  
  // Extract class name from metadata or default
  const className = workout.metadata?.class_name || 
                   workout.metadata?.modality || 
                   'Workout Session';

  const convertedBlocks = workout.blocks.map(block => {
    const timeline = [];
    
    // Handle different block types with their specific timing patterns
    switch (block.type.toUpperCase()) {
      case 'WARMUP':
      case 'COOLDOWN': {
        // Simple timing - each exercise gets equal time
        let exerciseTime = 30; // default
        
        if (block.format?.work) {
          // Handle patterns like "30s × 6" 
          const workStr = block.format.work;
          if (workStr.includes('×')) {
            exerciseTime = parseTimeString(workStr.split('×')[0]?.trim() || '30s');
          } else {
            exerciseTime = parseTimeString(workStr);
          }
        }
        
        for (const exercise of block.exercises) {
          // Use reps_or_time if available, otherwise use calculated time
          const duration = exercise.reps_or_time ? 
            parseTimeString(exercise.reps_or_time) : exerciseTime;
          timeline.push({
            time: duration || exerciseTime,
            activity: exercise.name
          });
        }
        break;
      }
      
      case 'TABATA': {
        // 20s work / 10s rest pattern
        const rounds = block.format?.rounds || 8; // Standard TABATA is 8 rounds
        let workTime = parseTimeString(block.format?.work || '20s');
        let restTime = parseTimeString(block.format?.rest || '10s');
        
        // Try to parse combined work/rest format if individual times are 0
        if (workTime === 0 || restTime === 0) {
          const combined = block.format?.work || block.format?.intervals || '';
          const parsed = parseWorkRestFormat(combined);
          workTime = parsed.work || 20;
          restTime = parsed.rest || 10;
        }
        
        // Cycle through exercises across rounds
        for (let round = 0; round < rounds; round++) {
          const exerciseIndex = round % block.exercises.length;
          const exercise = block.exercises[exerciseIndex];
          
          timeline.push({
            time: workTime,
            activity: exercise.name
          });
          
          // Add rest after work (except for last round)
          if (round < rounds - 1 && restTime > 0) {
            timeline.push({
              time: restTime,
              activity: 'REST'
            });
          }
        }
        break;
      }
      
      case 'COMBO': {
        // Handle combo patterns like "25s A / 25s B / 25s A+B"
        const rounds = block.format?.rounds || 1;
        const intervals = block.format?.intervals || '25s / 25s / 25s';
        
        // Parse the interval pattern
        const intervalTimes = intervals.split('/').map(s => 
          parseTimeString(s.trim().split(' ')[0])
        );
        
        for (let round = 0; round < rounds; round++) {
          // First exercise alone
          if (block.exercises[0] && intervalTimes[0]) {
            timeline.push({
              time: intervalTimes[0],
              activity: block.exercises[0].name
            });
          }
          
          // Second exercise alone  
          if (block.exercises[1] && intervalTimes[1]) {
            timeline.push({
              time: intervalTimes[1],
              activity: block.exercises[1].name
            });
          }
          
          // Combined exercises
          if (intervalTimes[2]) {
            const comboName = block.exercises.map(ex => ex.name).join(' + ');
            timeline.push({
              time: intervalTimes[2],
              activity: comboName
            });
          }
          
          // Add transition time between rounds
          if (round < rounds - 1 && block.transitions_sec) {
            timeline.push({
              time: block.transitions_sec,
              activity: 'REST'
            });
          }
        }
        break;
      }
      
      case 'INTERVAL': {
        // Handle custom schemes or standard work/rest intervals
        if (block.format?.scheme) {
          // Handle custom timing schemes like "40/20/10/10/20/40 with 15s rests"
          const scheme = block.format.scheme;
          const exercise = block.exercises[0]?.name || 'Exercise';
          
          if (scheme.includes('40/20/10/10/20/40')) {
            const times = [40, 20, 10, 10, 20, 40];
            const restTime = 15; // from "15s rests"
            
            for (let i = 0; i < times.length; i++) {
              timeline.push({
                time: times[i],
                activity: exercise
              });
              
              if (i < times.length - 1) {
                timeline.push({
                  time: restTime,
                  activity: 'REST'
                });
              }
            }
          }
        } else {
          // Standard work/rest intervals
          const rounds = block.format?.rounds || 1;
          const workTime = parseTimeString(block.format?.work || '30s');
          const restTime = parseTimeString(block.format?.rest || '15s');
          
          for (let round = 0; round < rounds; round++) {
            for (const exercise of block.exercises) {
              timeline.push({
                time: workTime,
                activity: exercise.name
              });
              if (restTime > 0) {
                timeline.push({
                  time: restTime,
                  activity: 'REST'
                });
              }
            }
            
            // Add rest between rounds (not after the last round)
            if (round < rounds - 1 && block.transitions_sec) {
              timeline.push({
                time: block.transitions_sec,
                activity: 'REST'
              });
            }
          }
        }
        break;
      }
      
      case 'RANDOMIZED': {
        // Build basic work/rest timeline and use repeat/rest_between_sets
        let workTime = parseTimeString(block.format?.work || '30s');
        let restTime = parseTimeString(block.format?.rest || '15s');
        
        // Try to parse combined work/rest format if individual times are 0
        if (workTime === 0 || restTime === 0) {
          const combined = block.format?.work || block.format?.intervals || '';
          const parsed = parseWorkRestFormat(combined);
          workTime = parsed.work || workTime;
          restTime = parsed.rest || restTime;
        }
        
        // Create basic timeline for one round
        for (const exercise of block.exercises) {
          timeline.push({
            time: workTime,
            activity: exercise.name
          });
          if (restTime > 0) {
            timeline.push({
              time: restTime,
              activity: 'REST'
            });
          }
        }
        break;
      }
      
      case 'EMOM': {
        // Every Minute on the Minute
        const rounds = block.format?.rounds || 5;
        const intervalTime = 60; // EMOM is always 1 minute intervals
        
        for (let round = 0; round < rounds; round++) {
          const exerciseIndex = round % block.exercises.length;
          const exercise = block.exercises[exerciseIndex];
          const activityName = exercise.reps_or_time ? 
            `${exercise.name} (${exercise.reps_or_time})` : 
            exercise.name;
          timeline.push({
            time: intervalTime,
            activity: activityName
          });
        }
        break;
      }
      
      case 'CHALLENGE': {
        // Single long challenge (like AMRAP)
        const duration = parseTimeString(block.format?.work || '120s');
        const exercise = block.exercises[0];
        
        if (exercise) {
          const activityName = exercise.reps_or_time ? 
            `${exercise.name} (${exercise.reps_or_time})` : 
            `${exercise.name} (Max Effort)`;
          timeline.push({
            time: duration,
            activity: activityName
          });
        }
        
        // Add rest if specified
        if (block.format?.rest) {
          const restDuration = parseTimeString(block.format.rest);
          if (restDuration > 0) {
            timeline.push({
              time: restDuration,
              activity: 'REST'
            });
          }
        }
        break;
      }
      
      case 'LADDER': {
        // Ladder format - climb up then down with exercises
        const exercises = block.exercises;
        const defaultPattern = [1, 2, 3, 4, 3, 2, 1]; // Default ladder pattern
        const intervalTime = 30; // Default 30s per interval
        
        for (const reps of defaultPattern) {
          for (const exercise of exercises) {
            timeline.push({
              time: intervalTime,
              activity: `${exercise.name} (${reps} reps)`
            });
          }
        }
        break;
      }
      
      default: {
        // Default case - distribute time evenly among exercises
        const totalTime = (block.duration_min || 1) * 60;
        const exerciseTime = Math.floor(totalTime / block.exercises.length);
        
        for (const exercise of block.exercises) {
          timeline.push({
            time: exerciseTime,
            activity: exercise.name
          });
        }
      }
    }
    
    // Build the converted block
    const convertedBlock: any = {
      name: block.title || block.type,
      type: block.type,
      timeline: timeline.filter(item => item.time > 0) // Remove invalid entries
    };
    
    // Add repeat and rest_between_sets for RANDOMIZED blocks  
    if (block.type.toUpperCase() === 'RANDOMIZED') {
      if (block.format?.rounds && block.format.rounds > 1) {
        convertedBlock.repeat = block.format.rounds;
      }
      if (block.transitions_sec) {
        convertedBlock.rest_between_sets = block.transitions_sec;
      }
    }
    
    return convertedBlock;
  });

  return {
    class_name: className,
    blocks: convertedBlocks.filter(block => block.timeline.length > 0)
  };
}

// Check if a workout uses the complex format
export function isComplexWorkoutFormat(workout: any): boolean {
  if (!workout || typeof workout !== 'object') return false;
  
  // Check for complex format indicators
  const hasMetadata = workout.metadata && typeof workout.metadata === 'object';
  const hasComplexBlocks = workout.blocks && Array.isArray(workout.blocks) && 
    workout.blocks.some((block: any) => 
      block.exercises && Array.isArray(block.exercises) &&
      block.format && typeof block.format === 'object'
    );
  
  return hasMetadata || hasComplexBlocks;
}