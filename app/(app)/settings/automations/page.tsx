import {
  TaskAutomationForm,
  type StepOption,
} from "@/components/settings/task-automation-form";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { isDrizzleBackend } from "@/lib/db/backend";
import { loadTaskAutomationFormValues } from "@/lib/repos/settings";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { loadTaskAutomationSetting } from "@/lib/strapi/task-automation-setting";

import { updateTaskAutomationSetting } from "../actions";

interface StrapiList<T> {
  data: T[];
}

interface StepEntity {
  documentId: string;
  name: string;
}

async function loadSteps(): Promise<StepOption[]> {
  if (isDrizzleBackend()) {
    const rows = await listStepsRepo();
    return rows.map((step) => ({
      documentId: step.id,
      name: step.name,
    }));
  }

  try {
    const res = await strapiFetch<StrapiList<StepEntity>>(
      "/steps",
      { strapiCache: { tags: [STRAPI_TAGS.steps], revalidate: 60 } },
      {
        fields: ["documentId", "name"],
        sort: ["index:asc"],
        pagination: { pageSize: 100 },
      },
    );

    return res.data.map((step) => ({
      documentId: step.documentId,
      name: step.name,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function SettingsAutomationsPage() {
  const [steps, taskAutomation] = await Promise.all([
    loadSteps(),
    isDrizzleBackend()
      ? loadTaskAutomationFormValues()
      : loadTaskAutomationSetting(),
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
