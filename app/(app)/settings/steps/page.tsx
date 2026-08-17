import { StepManager, type StepRow } from "@/components/steps/step-manager";
import { loadCachedSettingsSteps } from "@/lib/steps/load-settings-steps";
import { mapStepRecordToSettingsRow } from "@/lib/steps/map-settings-step";

import { createStep, deleteStep, reorderSteps, updateStep } from "./actions";

async function loadSteps(): Promise<StepRow[]> {
  const rows = await loadCachedSettingsSteps();
  return rows.map(mapStepRecordToSettingsRow);
}

export default async function SettingsStepsPage() {
  const steps = await loadSteps();

  return (
    <StepManager
      steps={steps}
      onCreate={createStep}
      onUpdate={updateStep}
      onReorder={reorderSteps}
      onDelete={deleteStep}
    />
  );
}
