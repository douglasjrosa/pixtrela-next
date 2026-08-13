import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { StepManager, type StepRow } from "@/components/steps/step-manager";
import { isDrizzleBackend } from "@/lib/db/backend";
import { listSteps as listStepsRepo } from "@/lib/repos/steps";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { createStep, deleteStep, reorderSteps, updateStep } from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface StepEntity {
  documentId: string;
  name: string;
  index: number;
  taskOrderBy?: StepRow["orderBy"];
}

async function loadSteps(): Promise<StepRow[]> {
  if (isDrizzleBackend()) {
    const rows = await listStepsRepo();
    return rows.map((step) => ({
      documentId: step.id,
      name: step.name,
      index: step.index,
      orderBy: step.taskOrderBy,
    }));
  }

  try {
    const res = await strapiFetch<StrapiList<StepEntity>>(
      "/steps",
      { strapiCache: { tags: [STRAPI_TAGS.steps], revalidate: 60 } },
      { fields: ["documentId", "name", "index"], sort: "index:asc" },
    );
    return res.data.map((step) => ({
      documentId: step.documentId,
      name: step.name,
      index: step.index,
      orderBy: step.taskOrderBy ?? "manual",
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
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
