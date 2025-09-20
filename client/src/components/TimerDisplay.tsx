import { motion } from "framer-motion";
import { formatTime } from "@shared/timer-utils";
import { getIntervalColor } from "@shared/timer-schema";
import type { FlatInterval, TimerState } from "@shared/timer-schema";
import SegmentedProgressBar from "./SegmentedProgressBar";
import LiveTimerDisplay from "./LiveTimerDisplay";

interface TimerDisplayProps {
  currentInterval: FlatInterval | null;
  timeRemaining: number;
  state: TimerState;
  progress: number;
  nextInterval: FlatInterval | null;
  intervals: FlatInterval[];
  currentIndex: number;
  elapsedTime: number;
  totalDuration: number;
}

export default function TimerDisplay({ 
  currentInterval, 
  timeRemaining, 
  state, 
  progress,
  nextInterval,
  intervals,
  currentIndex,
  elapsedTime,
  totalDuration
}: TimerDisplayProps) {
  if (!currentInterval) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-black text-foreground">
            Ready to Train
          </h1>
          <p className="text-xl text-muted-foreground">
            Load a workout plan to get started
          </p>
        </div>
      </div>
    );
  }

  const colorClass = getIntervalColor(currentInterval);
  const isCompleted = state === "completed";

  if (isCompleted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
        <motion.div 
          className="text-center space-y-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "backOut" }}
        >
          <motion.h1 
            className="text-8xl font-black text-white drop-shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Complete!
          </motion.h1>
          <p className="text-2xl text-white/90">
            Great job finishing your workout!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col relative overflow-hidden ${colorClass} touch-none select-none`}>
      {/* Segmented Progress bar */}
      <div className="absolute top-0 left-0 right-0 p-2">
        <SegmentedProgressBar 
          intervals={intervals} 
          currentIndex={currentIndex}
          className="shadow-sm"
        />
      </div>

      <div className={`flex-1 flex flex-col items-center justify-center text-center p-8 space-y-8 ${nextInterval ? 'pb-24 md:pb-8' : ''}`}>
        {/* Block info */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-4xl font-bold opacity-90">
            {currentInterval.blockName}
            {currentInterval.setNumber && (
              <span className="opacity-70 ml-4">
                Set {currentInterval.setNumber}/{currentInterval.totalSets}
              </span>
            )}
          </h2>
        </div>

        {/* Activity name */}
        <motion.h1 
          className="text-4xl md:text-7xl lg:text-8xl font-black drop-shadow-lg leading-tight"
          key={currentInterval.activity}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {currentInterval.activity}
        </motion.h1>

        {/* Countdown */}
        <motion.div 
          className="text-9xl md:text-[12rem] lg:text-[16rem] font-black drop-shadow-2xl leading-none"
          animate={{ 
            scale: timeRemaining <= 3 && timeRemaining > 0 && state === "running" ? [1, 1.1, 1] : 1
          }}
          transition={{ 
            scale: { duration: 1, repeat: timeRemaining <= 3 && timeRemaining > 0 ? Infinity : 0 }
          }}
        >
          {formatTime(timeRemaining)}
        </motion.div>

        {/* State indicator */}
        {state === "paused" && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="text-6xl text-white/80">⏸️</div>
          </motion.div>
        )}

        {/* Live elapsed/remaining display under timer digits */}
        <LiveTimerDisplay
          elapsedTime={elapsedTime}
          totalDuration={totalDuration}
          currentIndex={currentIndex}
          totalIntervals={intervals.length}
        />
      </div>

      {/* Up Next card - Fixed position with next state background color */}
      {nextInterval && (
        <motion.div 
          className={`fixed bottom-8 right-8 md:bottom-8 md:right-8 sm:bottom-4 sm:left-1/2 sm:transform sm:-translate-x-1/2 sm:right-auto 
                     ${getIntervalColor(nextInterval)} rounded-lg p-4 min-w-[200px] shadow-lg border border-black/20`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          data-testid="up-next-card"
        >
          <p className="text-sm font-medium opacity-70 mb-1">Up Next:</p>
          <p className="font-bold text-lg mb-1">{nextInterval.activity}</p>
          <p className="text-sm opacity-90">{formatTime(nextInterval.duration)}</p>
        </motion.div>
      )}
    </div>
  );
}