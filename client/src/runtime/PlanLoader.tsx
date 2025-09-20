import { useState } from "react";
import { classPlanV1, type ClassPlanV1 } from "@shared/class-plan-v1";
import { ZodError } from "zod";
import { isComplexPlan, convertComplexToV1 } from "@shared/convert";

type Props = {
  onLoad: (plan: ClassPlanV1) => void;
  samples?: { name: string; plan: ClassPlanV1 }[];
};

export default function PlanLoader({ onLoad, samples = [] }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLoad = () => {
    setError(null);
    try {
      let obj = JSON.parse(text);
      // If user pasted complex format, convert automatically
      if (isComplexPlan(obj)) {
        obj = convertComplexToV1(obj);
      }
      const plan = classPlanV1.parse(obj);
      onLoad(plan);
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        setError(`JSON syntax error: ${e.message}`);
        return;
      }
      if (e instanceof ZodError) {
        const msgs = e.issues.map((iss) => {
          const path = iss.path.join(".") || "<root>";
          return `${path}: ${iss.message}`;
        });
        setError(`Validation failed:\n- ${msgs.join("\n- ")}`);
        return;
      }
      setError(e?.message ?? "Invalid JSON");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Load Class Plan (v1)</h1>
      <p className="text-sm text-muted-foreground">Paste a JSON plan or load a sample.</p>
      <div className="flex gap-2 flex-wrap">
        {samples.map((s, i) => (
          <button key={i} className="px-3 py-1 rounded border hover-elevate text-sm" onClick={() => setText(JSON.stringify(s.plan, null, 2))}>
            Load {s.name}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-64 font-mono text-sm border rounded p-3 bg-background"
        placeholder='{"class_name":"...","blocks":[...]}'
      />
      {error && (
        <pre className="whitespace-pre-wrap text-red-600 text-sm border border-red-300 rounded p-2 bg-red-50 dark:bg-red-950/20">
{error}
        </pre>
      )}
      <div className="flex justify-end">
        <button onClick={handleLoad} className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90">Load Plan</button>
      </div>
    </div>
  );
}
