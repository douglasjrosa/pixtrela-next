import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { StepManager, type StepRow } from "@/components/steps/step-manager";
import type { Role } from "@/lib/auth/nav";
import { canDeleteTasks, canManageSteps } from "@/lib/auth/permissions";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { createStep, deleteStep, updateStep } from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface StepEntity {
  documentId: string;
  name: string;
  index: number;
}

async function loadSteps(): Promise<StepRow[]> {
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
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function StepsPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageSteps(role)) {
    return <ForbiddenMessage />;
  }

  const steps = await loadSteps();

  return (
    <section className="p-6">
      <StepManager
        steps={steps}
        onCreate={createStep}
        onUpdate={updateStep}
        onDelete={deleteStep}
        canDelete={canDeleteTasks(role)}
      />
    </section>
  );
}
