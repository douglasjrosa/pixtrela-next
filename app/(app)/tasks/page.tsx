import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { TaskManager, type TaskRow, type StepOption } from "@/components/tasks/task-manager";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks } from "@/lib/auth/permissions";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import type { TaskFormInput } from "@/lib/schemas/task";

interface StrapiList<T> {
  data: T[];
}

interface TaskEntity {
  documentId: string;
  name: string;
  qty: number;
  deliveryDate?: string | null;
  index: number;
  status: TaskFormInput["status"];
  active?: boolean;
  templateTaskCode?: string | null;
  totalExpectedTime?: number;
  totalTimeSpent?: number;
  step?: { documentId: string; name: string } | null;
}

interface StepEntity {
  documentId: string;
  name: string;
}

async function loadTasks(): Promise<TaskRow[]> {
  try {
    const res = await strapiFetch<StrapiList<TaskEntity>>(
      "/tasks",
      { strapiCache: { tags: [STRAPI_TAGS.tasks], revalidate: 30 } },
      {
        fields: [
          "documentId",
          "name",
          "qty",
          "deliveryDate",
          "index",
          "status",
          "active",
          "templateTaskCode",
          "totalExpectedTime",
          "totalTimeSpent",
        ],
        populate: { step: { fields: ["documentId", "name"] } },
        sort: "index:asc",
      },
    );
    return res.data.map((task) => ({
      documentId: task.documentId,
      name: task.name,
      qty: task.qty,
      deliveryDate: task.deliveryDate,
      index: task.index,
      status: task.status,
      active: task.active ?? true,
      templateTaskCode: task.templateTaskCode,
      totalExpectedTime: task.totalExpectedTime ?? 0,
      totalTimeSpent: task.totalTimeSpent ?? 0,
      step: task.step ?? null,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

async function loadSteps(): Promise<StepOption[]> {
  try {
    const res = await strapiFetch<StrapiList<StepEntity>>(
      "/steps",
      { strapiCache: { tags: [STRAPI_TAGS.steps], revalidate: 60 } },
      { fields: ["documentId", "name"], sort: "index:asc" },
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

export default async function TasksPage() {
  const t = await getTranslations("errors");
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTasks(role)) {
    return (
      <section className="p-6">
        <p className="text-destructive">{t("forbidden")}</p>
      </section>
    );
  }

  const [tasks, steps] = await Promise.all([loadTasks(), loadSteps()]);

  return (
    <section className="p-6">
      <TaskManager
        tasks={tasks}
        steps={steps}
      />
    </section>
  );
}
