import {
  TaskAutomationForm,
  type StepOption,
} from "@/components/settings/task-automation-form";
import { loadTaskAutomationSetting } from "@/lib/settings/load-task-automation";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";

import { updateTaskAutomationSetting } from "../actions";

async function loadSteps(): Promise<StepOption[]> {
  const rows = await listStepsRepo();
  return rows.map((step) => ({
    documentId: step.id,
    name: step.name,
  }));
}

export default async function SettingsAutomationsPage() {
  const [steps, taskAutomation] = await Promise.all([
    loadSteps(),
    loadTaskAutomationSetting(),
  ]);

  return (
    <TaskAutomationForm
      steps={steps}
      defaultValues={taskAutomation}
      action={updateTaskAutomationSetting}
    />
  );
}
