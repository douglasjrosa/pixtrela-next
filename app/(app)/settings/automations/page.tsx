import {
  TaskAutomationForm,
  type StepOption,
} from "@/components/settings/task-automation-form";
import { loadTaskAutomationSetting } from "@/lib/settings/load-task-automation";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import type { TaskAutomationFormInput } from "@/lib/schemas/task-automation";

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

  async function handleSaveTaskAutomation(
    values: TaskAutomationFormInput,
  ): Promise<void> {
    "use server";
    await updateTaskAutomationSetting(values);
  }

  return (
    <TaskAutomationForm
      steps={steps}
      defaultValues={taskAutomation}
      onSave={handleSaveTaskAutomation}
    />
  );
}
