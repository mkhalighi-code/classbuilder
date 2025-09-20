import { ClassPlanV1, FlatIntervalV1, IntervalTypeV1, classPlanV1 } from "./class-plan-v1";

export type BuildOptions = {
  defaultBetweenBlockTransitionSec?: number; // default 15
};

export type BuiltSchedule = {
  intervals: FlatIntervalV1[];
  totalSeconds: number;
};

// Validates input and builds a flat schedule (no countdowns here — engine handles 3-2-1)
export function buildSchedule(plan: unknown, opts: BuildOptions = {}): BuiltSchedule {
  const parsed = classPlanV1.parse(plan);
  const defaultBetween = opts.defaultBetweenBlockTransitionSec ?? 15;
  const result: FlatIntervalV1[] = [];
  let index = 0;

  for (let b = 0; b < parsed.blocks.length; b++) {
    const block = parsed.blocks[b];
    const rounds = block.format.rounds ?? 1;

    for (let r = 1; r <= rounds; r++) {
      for (const item of block.intervals) {
        const flat: FlatIntervalV1 = {
          index,
          blockId: block.id,
          blockTitle: block.title,
          blockObjective: block.objective,
          type: item.type as IntervalTypeV1,
          label: item.label,
          seconds: item.seconds,
          round: r,
          totalRounds: rounds,
        };
        result.push(flat);
        index++;
      }

      // Between sets within same block: not specified, so none in v1 (future option)
    }

    // Inject between-block transition if needed
    if (b < parsed.blocks.length - 1) {
      const lastOfBlock = result[result.length - 1];
      // If the last interval is not a transition, add a default transition
      if (lastOfBlock && lastOfBlock.type !== "transition") {
        const nextBlock = parsed.blocks[b + 1];
        result.push({
          index: index++,
          blockId: nextBlock.id, // associate to upcoming block for display
          blockTitle: nextBlock.title,
          blockObjective: nextBlock.objective,
          type: "transition",
          label: "Transition",
          seconds: defaultBetween,
          round: 1,
          totalRounds: nextBlock.format.rounds ?? 1,
        });
      }
    }
  }

  const totalSeconds = result.reduce((acc, it) => acc + it.seconds, 0);
  return { intervals: result, totalSeconds };
}
