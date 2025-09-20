import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle2, Circle, ChevronDown, ChevronRight, Play } from "lucide-react";
import { formatTime } from "@shared/timer-utils";
import { getIntervalColor, getStatusDotColor } from "@shared/timer-schema";
import type { FlatInterval } from "@shared/timer-schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ProgramSidebarProps {
  intervals: FlatInterval[];
  currentIndex: number;
  className?: string;
  totalDuration: number;
  elapsedTime: number;
  onJumpToInterval?: (index: number) => void;
}

export default function ProgramSidebar({
  intervals,
  currentIndex,
  className = "",
  totalDuration,
  elapsedTime,
  onJumpToInterval,
}: ProgramSidebarProps) {
  // Collapsible state for each block
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const [jumpingToIndex, setJumpingToIndex] = useState<number | null>(null);
  const currentIntervalRef = useRef<HTMLDivElement>(null);

  // Group intervals by blocks for better organization
  const groupedIntervals = intervals.reduce((groups, interval, index) => {
    const key = `${interval.blockName}-${interval.setNumber || 1}`;
    if (!groups[key]) {
      groups[key] = {
        blockName: interval.blockName,
        blockType: interval.blockType,
        setNumber: interval.setNumber,
        totalSets: interval.totalSets,
        intervals: [],
        isCurrentBlock: false,
      };
    }
    groups[key].intervals.push({ ...interval, originalIndex: index });
    
    // Check if this block contains the current interval
    if (index === currentIndex) {
      groups[key].isCurrentBlock = true;
    }
    
    return groups;
  }, {} as Record<string, any>);

  // Initialize collapse state and only auto-expand when current block changes
  useEffect(() => {
    const currentBlock = Object.keys(groupedIntervals).find(key => 
      groupedIntervals[key].isCurrentBlock
    );
    
    setCollapsedBlocks(prev => {
      const newState = { ...prev };
      
      // Initialize any new blocks as collapsed
      Object.keys(groupedIntervals).forEach(key => {
        if (!(key in newState)) {
          newState[key] = true; // Default collapsed
        }
      });
      
      // Auto-expand current block if it's different from previously expanded
      if (currentBlock && newState[currentBlock] !== false) {
        newState[currentBlock] = false; // Expand current block
      }
      
      return newState;
    });
  }, [intervals]); // Only when intervals change, not every currentIndex change

  // Auto-scroll to current interval
  useEffect(() => {
    if (currentIntervalRef.current) {
      currentIntervalRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex]);

  const toggleBlockCollapse = (blockKey: string) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [blockKey]: !prev[blockKey]
    }));
  };

  const handleIntervalClick = (intervalIndex: number) => {
    if (onJumpToInterval) {
      setJumpingToIndex(intervalIndex);
    }
  };

  const confirmJump = () => {
    if (jumpingToIndex !== null && onJumpToInterval) {
      onJumpToInterval(jumpingToIndex);
      setJumpingToIndex(null);
    }
  };

  return (
    <div className={`bg-sidebar border-r border-sidebar-border h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-4">
          Program Outline
        </h2>
        
        {/* Progress summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-sidebar-foreground/70">Progress</span>
            <span className="text-sidebar-foreground">
              {currentIndex + 1} / {intervals.length}
            </span>
          </div>
          <div className="w-full bg-sidebar-accent rounded-full h-2">
            <motion.div
              className="bg-sidebar-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / intervals.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-xs text-sidebar-foreground/70">
            <span>{formatTime(elapsedTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>
      </div>

      {/* Intervals list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {Object.values(groupedIntervals).map((group, groupIndex) => (
            <motion.div
              key={`${group.blockName}-${group.setNumber}`}
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.1 }}
            >
              {/* Block header - clickable to collapse/expand */}
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between p-2 h-auto"
                onClick={() => toggleBlockCollapse(`${group.blockName}-${group.setNumber}`)}
                data-testid={`button-toggle-block-${group.blockName}`}
              >
                <div className="flex items-center gap-2">
                  {collapsedBlocks[`${group.blockName}-${group.setNumber}`] ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <h3 className="font-medium text-sidebar-foreground text-sm">
                    {group.blockName}
                    {group.setNumber && (
                      <span className="text-sidebar-foreground/60 ml-2">
                        Set {group.setNumber}/{group.totalSets}
                      </span>
                    )}
                  </h3>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                >
                  {group.blockType}
                </Badge>
              </Button>

              {/* Intervals in this block - collapsible */}
              {!collapsedBlocks[`${group.blockName}-${group.setNumber}`] && (
                <motion.div 
                  className="space-y-1 pl-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {group.intervals.map((interval: any) => {
                    const isCurrent = interval.originalIndex === currentIndex;
                    const isCompleted = interval.originalIndex < currentIndex;
                    const isPending = interval.originalIndex > currentIndex;
                    const statusDotColor = getStatusDotColor(interval);

                    return (
                      <motion.div
                        key={interval.id}
                        ref={isCurrent ? currentIntervalRef : null}
                        className={`
                          flex items-center gap-3 p-3 rounded-md transition-all duration-200 cursor-pointer
                          ${isCurrent 
                            ? 'bg-sidebar-accent border-l-4 border-l-sidebar-primary' 
                            : isCompleted 
                              ? 'bg-sidebar-accent/50' 
                              : 'hover:bg-sidebar-accent/30'
                          }
                        `}
                        animate={{
                          scale: isCurrent ? 1.02 : 1,
                          x: isCurrent ? 4 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleIntervalClick(interval.originalIndex)}
                        data-testid={`interval-${interval.originalIndex}`}
                      >
                        {/* Status dot */}
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : isCurrent ? (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <div className={`h-3 w-3 rounded-full ${statusDotColor}`} />
                            </motion.div>
                          ) : (
                            <div className={`h-3 w-3 rounded-full ${statusDotColor} opacity-50`} />
                          )}
                        </div>

                        {/* Interval details */}
                        <div className="flex-1 min-w-0">
                          <p className={`
                            font-medium text-sm truncate
                            ${isCurrent ? 'text-sidebar-foreground' : 'text-sidebar-foreground/80'}
                          `}>
                            {interval.activity}
                          </p>
                          {interval.isRest && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Rest
                            </Badge>
                          )}
                          {/* Show instructor notes if available */}
                          {interval.notes && (
                            <Badge variant="secondary" className="mt-1 text-xs bg-orange-100 text-orange-800">
                              Note
                            </Badge>
                          )}
                        </div>

                        {/* Duration */}
                        <div className="flex-shrink-0 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-sidebar-foreground/50" />
                          <span className="text-xs text-sidebar-foreground/70">
                            {formatTime(interval.duration)}
                          </span>
                        </div>

                        {/* Jump to button for non-current intervals */}
                        {!isCurrent && onJumpToInterval && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIntervalClick(interval.originalIndex);
                            }}
                            data-testid={`button-jump-${interval.originalIndex}`}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {/* Jump-to confirmation dialog */}
      <AlertDialog open={jumpingToIndex !== null} onOpenChange={() => setJumpingToIndex(null)}>
        <AlertDialogContent data-testid="dialog-jump-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Jump to Interval?</AlertDialogTitle>
            <AlertDialogDescription>
              {jumpingToIndex !== null && intervals[jumpingToIndex] ? (
                <>
                  Jump to interval {jumpingToIndex + 1}: "{intervals[jumpingToIndex].activity}"?
                  {intervals[jumpingToIndex].isRest && " (Rest period)"}
                  <br />
                  This will pause the timer if it's currently running.
                </>
              ) : (
                "Confirm jumping to the selected interval."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-jump">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmJump} data-testid="button-confirm-jump">
              Jump to Interval
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}