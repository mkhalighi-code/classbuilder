import type { ClassPlanV1, BlockV1, IntervalV1 } from "./class-plan-v1";

// Heuristic detection of the complex format (versioned + metadata wrapper)
export function isComplexPlan(input: any): boolean {
  return (
    !!input &&
    typeof input === "object" &&
    typeof input.version === "string" &&
    input.metadata && typeof input.metadata === "object" &&
    Array.isArray(input.blocks)
  );
}

// Convert the complex JSON shape into ClassPlanV1
export function convertComplexToV1(input: any): ClassPlanV1 {
  const meta = input.metadata ?? {};
  const class_name: string = meta.class_name ?? meta.title ?? "Untitled Class";
  const duration_min: number | undefined = typeof meta.duration_min === "number" ? meta.duration_min : undefined;

  const blocks: BlockV1[] = (input.blocks ?? []).map((b: any, idx: number) => {
    const id = typeof b.id === "string" ? b.id : `b${idx + 1}`;
    const title = typeof b.title === "string" ? b.title : `Block ${idx + 1}`;
    const objective = typeof b.objective === "string" ? b.objective : "";
    const rounds = b?.format?.rounds && Number.isInteger(b.format.rounds) ? b.format.rounds : 1;

    const intervals: IntervalV1[] = (b.intervals ?? []).map((it: any) => {
      const type = (typeof it.type === "string" ? it.type.toLowerCase() : "work") as IntervalV1["type"];
      const label = typeof it.label === "string" ? it.label : (type === "rest" ? "Rest" : "Work");
      const seconds = typeof it.seconds === "number" ? Math.max(1, Math.floor(it.seconds)) : 1;
      return { type, label, seconds };
    });

    return {
      id,
      title,
      objective,
      format: { rounds },
      intervals,
    } satisfies BlockV1;
  });

  return {
    class_name,
    duration_min,
    blocks,
  } satisfies ClassPlanV1;
}
