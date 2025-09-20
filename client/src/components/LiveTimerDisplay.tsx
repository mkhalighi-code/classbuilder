import { formatTime } from "@shared/timer-utils";

interface LiveTimerDisplayProps {
  elapsedTime: number;
  totalDuration: number;
  currentIndex: number;
  totalIntervals: number;
}

export default function LiveTimerDisplay({
  elapsedTime,
  totalDuration,
  currentIndex,
  totalIntervals,
}: LiveTimerDisplayProps) {
  const remainingTime = totalDuration - elapsedTime;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
      <div className="bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2 space-y-1">
        <div className="flex items-center gap-6 text-sm font-medium opacity-90">
          <div>
            <span className="text-white/70">Elapsed: </span>
            <span className="text-white">{formatTime(elapsedTime)}</span>
          </div>
          <div>
            <span className="text-white/70">Remaining: </span>
            <span className="text-white">{formatTime(remainingTime)}</span>
          </div>
        </div>
        <div className="text-xs text-white/70">
          Interval {currentIndex + 1} of {totalIntervals}
        </div>
      </div>
    </div>
  );
}