import SecondsTimer from "../SecondsTimer";
import { SAMPLE_CLASS_PLAN } from "@shared/timer-utils";

export default function SecondsTimerExample() {
  return (
    <SecondsTimer
      initialPlan={SAMPLE_CLASS_PLAN}
      autoStart={false}
      showSidebar={true}
    />
  );
}