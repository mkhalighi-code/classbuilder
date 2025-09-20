import ProgramSidebar from "../ProgramSidebar";
import { flattenClassPlan, SAMPLE_CLASS_PLAN } from "@shared/timer-utils";

const mockIntervals = flattenClassPlan(SAMPLE_CLASS_PLAN);

export default function ProgramSidebarExample() {
  return (
    <div className="h-screen w-80">
      <ProgramSidebar
        intervals={mockIntervals}
        currentIndex={3}
        totalDuration={420}
        elapsedTime={180}
      />
    </div>
  );
}