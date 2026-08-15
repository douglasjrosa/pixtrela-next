import { StepManager, type StepRow } from "@/components/steps/step-manager";
import { loadCachedSettingsSteps } from "@/lib/steps/load-settings-steps";

import { createStep, deleteStep, reorderSteps, updateStep } from "./actions";

async function loadSteps(): Promise<StepRow[]> {
  const rows = await loadCachedSettingsSteps();
  return rows.map((step) => ({
    documentId: step.id,
    name: step.name,
    index: step.index,
    orderBy: step.taskOrderBy,
  }));
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
