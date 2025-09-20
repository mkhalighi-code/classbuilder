import { motion } from "framer-motion";
import { formatTime } from "@shared/timer-utils";
import { getIntervalColor } from "@shared/timer-schema";
import type { FlatInterval } from "@shared/timer-schema";

interface SegmentedProgressBarProps {
  intervals: FlatInterval[];
  currentIndex: number;
  className?: string;
}

export default function SegmentedProgressBar({ 
  intervals, 
  currentIndex, 
  className = "" 
}: SegmentedProgressBarProps) {
  if (intervals.length === 0) return null;

  // Calculate total duration once to avoid O(n^2) complexity
  const totalDuration = intervals.reduce((sum, int) => sum + int.duration, 0);

  return (
    <div className={`w-full h-3 bg-black/20 rounded-full overflow-hidden ${className}`}>
      <div className="flex h-full">
        {intervals.map((interval, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const colorClass = getIntervalColor(interval);
          
          // Calculate relative width based on interval duration
          const widthPercent = (interval.duration / totalDuration) * 100;
          
          return (
            <div
              key={interval.id}
              className={`relative flex-shrink-0 group transition-all duration-200 hover:z-10`}
              style={{ width: `${widthPercent}%` }}
              data-testid={`progress-segment-${index}`}
            >
              {/* Progress segment */}
              <motion.div
                className={`h-full border-r border-black/20 ${
                  isCompleted 
                    ? colorClass + " opacity-60" 
                    : isActive 
                    ? colorClass + " opacity-100" 
                    : "bg-white/20"
                }`}
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: isCompleted ? 1 : isActive ? 1 : 0 
                }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: "left" }}
              />
              
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                <div className={`${colorClass} px-3 py-2 rounded-lg text-sm font-medium shadow-lg 
                              border border-black/20 whitespace-nowrap`}>
                  <div className="font-bold">#{index + 1} {interval.activity}</div>
                  <div className="opacity-80">{formatTime(interval.duration)}</div>
                  {interval.blockName && (
                    <div className="opacity-70 text-xs">{interval.blockName}</div>
                  )}
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 
                              border-l-4 border-r-4 border-t-4 border-transparent border-t-current"></div>
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute top-0 left-0 w-full h-full bg-white/30"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}