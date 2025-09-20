import type { FlatIntervalV1 } from "@shared/class-plan-v1";

export function Sidebar({
  intervals,
  currentIndex,
}: {
  intervals: FlatIntervalV1[];
  currentIndex: number;
}) {
  // Build block list from intervals
  const blocks: { id: string; title: string; objective: string; startIndex: number; endIndex: number }[] = [];
  for (let i = 0; i < intervals.length; i++) {
    const it = intervals[i];
    const last = blocks[blocks.length - 1];
    if (!last || last.id !== it.blockId) {
      blocks.push({ id: it.blockId, title: it.blockTitle, objective: it.blockObjective, startIndex: i, endIndex: i });
    } else {
      last.endIndex = i;
    }
  }

  return (
    <aside className="w-72 border-r h-full overflow-auto p-3">
      <div className="text-sm font-semibold mb-2">Class Blocks</div>
      <ul className="space-y-2">
        {blocks.map((b) => {
          const isCurrent = currentIndex >= b.startIndex && currentIndex <= b.endIndex;
          const isDone = currentIndex > b.endIndex;
          return (
            <li key={b.id} className={`p-3 rounded border ${isCurrent ? "bg-primary/10 border-primary" : isDone ? "opacity-70" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="font-medium truncate max-w-[8rem]" title={b.title}>{b.title}</div>
                {isDone ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-600 text-white">Done</span>
                ) : isCurrent ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">Current</span>
                ) : null}
              </div>
              {b.objective && (
                <div className="mt-1 text-xs text-muted-foreground line-clamp-2" title={b.objective}>{b.objective}</div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
