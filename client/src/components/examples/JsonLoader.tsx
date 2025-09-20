import JsonLoader from "../JsonLoader";
import type { ClassPlan } from "@shared/timer-schema";

export default function JsonLoaderExample() {
  const handleLoadPlan = (plan: ClassPlan) => {
    console.log("Plan loaded:", plan);
    alert(`Loaded plan: ${plan.class_name || "Unnamed Workout"}`);
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">JSON Loader Demo</h1>
      <p className="text-muted-foreground">
        Click the button below to test the JSON loading functionality
      </p>
      
      <div className="space-y-4">
        <JsonLoader onLoadPlan={handleLoadPlan} />
        
        {/* Custom trigger example */}
        <JsonLoader 
          onLoadPlan={handleLoadPlan}
          trigger={
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Custom Trigger Button
            </button>
          }
        />
      </div>
    </div>
  );
}