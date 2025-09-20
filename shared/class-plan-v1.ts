import { z } from "zod";

// Data Contract (v1) per spec
// type ∈ {work, rest, transition}
export const intervalTypeV1 = z.enum(["work", "rest", "transition"]);

export const intervalV1 = z.object({
  type: intervalTypeV1,
  label: z.string().min(1),
  seconds: z.number().int().positive(),
});

export const blockFormatV1 = z.object({
  rounds: z.number().int().positive().default(1),
});

export const blockV1 = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  format: blockFormatV1,
  intervals: z.array(intervalV1).min(1),
});

export const classPlanV1 = z.object({
  class_name: z.string().min(1),
  duration_min: z.number().int().positive().optional(),
  blocks: z.array(blockV1).min(1),
});

// Types
export type IntervalTypeV1 = z.infer<typeof intervalTypeV1>;
export type IntervalV1 = z.infer<typeof intervalV1>;
export type BlockV1 = z.infer<typeof blockV1>;
export type ClassPlanV1 = z.infer<typeof classPlanV1>;

// Flat, executable interval for the engine
export type FlatIntervalV1 = {
  index: number;
  blockId: string;
  blockTitle: string;
  blockObjective: string;
  type: IntervalTypeV1;
  label: string;
  seconds: number;
  // Display helpers
  round: number; // 1-based within block
  totalRounds: number; // per block
};
