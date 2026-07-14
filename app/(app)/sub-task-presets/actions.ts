"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks } from "@/lib/auth/permissions";
import {
  shouldSearchSubTaskPresets,
  type SubTaskPreset,
} from "@/lib/business/subtask-preset";
import { strapiFetch } from "@/lib/strapi";

interface StrapiList<T> {
  data: T[];
}

const PRESET_PAGE_SIZE = 10;

async function assertCanSearchPresets(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

export async function searchSubTaskPresets(
  query: string,
): Promise<SubTaskPreset[]> {
  await assertCanSearchPresets();

  const trimmed = query.trim();
  if (!shouldSearchSubTaskPresets(trimmed)) {
    return [];
  }

  const res = await strapiFetch<StrapiList<SubTaskPreset>>(
    "/sub-task-presets",
    { strapiCache: { noStore: true } },
    {
      fields: [
        "documentId",
        "name",
        "sharingType",
        "maxSameTimeWorkers",
        "expectedTime",
      ],
      filters: { name: { $containsi: trimmed } },
      sort: "name:asc",
      pagination: { pageSize: PRESET_PAGE_SIZE },
    },
  );

  return res.data.map((row) => ({
    documentId: row.documentId,
    name: row.name,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    expectedTime: row.expectedTime,
  }));
}
