import { auth } from "@/auth";
import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { Role } from "@/lib/auth/nav";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import type { SubTaskFormInput } from "@/lib/schemas/sub-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import { KioskPanelClient } from "./kiosk-panel-client";

interface StrapiList<T> {
  data: T[];
}

interface SubTaskEntity {
  documentId: string;
  name: string;
  index: number;
  status: SubTaskFormInput["status"];
  activationStatus?: SubTaskFormInput["activationStatus"];
  qty: number;
  targetQty?: number;
  completedQty?: number;
  sharingType: SubTaskFormInput["sharingType"];
  timeSpent: number;
  startedAt: string | null;
  expectedTime: number;
  taskDocumentId: string;
  taskName: string;
  taskIndex: number;
  finishedAt: string | null;
  activeWorkerCount?: number;
}

interface PageProps {
  params: Promise<{ colaboratorId: string }>;
}

async function loadAssignedSubTasks(
  colaboratorId: string,
): Promise<KioskSubTask[]> {
  try {
    const res = await strapiFetch<StrapiList<SubTaskEntity>>(
      `/kiosk/colaborators/${colaboratorId}/sub-tasks`,
      { strapiCache: { tags: [STRAPI_TAGS.subTasks], revalidate: 10 } },
    );
    return res.data.map((subtask) => ({
      documentId: subtask.documentId,
      name: subtask.name,
      index: subtask.index,
      status: subtask.status,
      activationStatus: subtask.activationStatus ?? "locked",
      qty: subtask.qty ?? 1,
      targetQty: subtask.targetQty ?? subtask.qty ?? 1,
      completedQty: subtask.completedQty ?? 0,
      sharingType: subtask.sharingType ?? "duration",
      timeSpent: subtask.timeSpent ?? 0,
      startedAt: subtask.startedAt ?? null,
      expectedTime: subtask.expectedTime ?? 0,
      taskDocumentId: subtask.taskDocumentId ?? "",
      taskName: subtask.taskName ?? "",
      taskIndex: subtask.taskIndex ?? 0,
      finishedAt: subtask.finishedAt ?? null,
      activeWorkerCount: subtask.activeWorkerCount ?? 0,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function KioskColaboratorPage({ params }: PageProps) {
  const { colaboratorId } = await params;
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const readOnly = role === "admin";
  const subTasks = await loadAssignedSubTasks(colaboratorId);

  return (
    <KioskPanelClient
      colaboratorId={colaboratorId}
      subTasks={subTasks}
      readOnly={readOnly}
    />
  );
}
