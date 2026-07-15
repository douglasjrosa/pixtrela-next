"use server";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageTasks, canManageTemplates } from "@/lib/auth/permissions";
import {
  shouldSearchSubTaskPresets,
  type SubTaskPreset,
} from "@/lib/business/subtask-preset";
import {
  subTaskPresetFormSchema,
  type SubTaskPresetFormInput,
} from "@/lib/schemas/sub-task-preset";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";
import { revalidateStrapiTags } from "@/lib/strapi/revalidate";

interface StrapiList<T> {
  data: T[];
}

interface StrapiOne<T> {
  data: T;
}

const PRESET_PAGE_SIZE = 10;
const PRESET_LIST_PAGE_SIZE = 100;

const PRESET_FIELDS = [
  "documentId",
  "name",
  "sharingType",
  "maxSameTimeWorkers",
  "expectedTime",
] as const;

function mapPresetRow(row: SubTaskPreset): SubTaskPreset {
  return {
    documentId: row.documentId,
    name: row.name,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    expectedTime: row.expectedTime,
  };
}

async function assertCanSearchPresets(): Promise<void> {
  const session = await auth();
  if (!canManageTasks(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

async function assertCanManagePresets(): Promise<void> {
  const session = await auth();
  if (!canManageTemplates(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidatePresets(): void {
  revalidateStrapiTags(STRAPI_TAGS.subTaskPresets);
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
      fields: [...PRESET_FIELDS],
      filters: { name: { $containsi: trimmed } },
      sort: "name:asc",
      pagination: { pageSize: PRESET_PAGE_SIZE },
    },
  );

  return res.data.map(mapPresetRow);
}

export async function listSubTaskPresets(): Promise<SubTaskPreset[]> {
  await assertCanManagePresets();

  const res = await strapiFetch<StrapiList<SubTaskPreset>>(
    "/sub-task-presets",
    {
      strapiCache: {
        tags: [STRAPI_TAGS.subTaskPresets],
        revalidate: 60,
      },
    },
    {
      fields: [...PRESET_FIELDS],
      sort: "name:asc",
      pagination: { pageSize: PRESET_LIST_PAGE_SIZE },
    },
  );

  return res.data.map(mapPresetRow);
}

export async function createSubTaskPreset(
  raw: SubTaskPresetFormInput,
): Promise<string> {
  await assertCanManagePresets();
  const data = subTaskPresetFormSchema.parse(raw);
  const res = await strapiFetch<StrapiOne<{ documentId: string }>>(
    "/sub-task-presets",
    {
      method: "POST",
      strapiCache: { noStore: true },
      body: JSON.stringify({ data }),
    },
  );
  invalidatePresets();
  return res.data.documentId;
}

export async function updateSubTaskPreset(
  documentId: string,
  raw: SubTaskPresetFormInput,
): Promise<void> {
  await assertCanManagePresets();
  const data = subTaskPresetFormSchema.parse(raw);
  await strapiFetch(`/sub-task-presets/${documentId}`, {
    method: "PUT",
    strapiCache: { noStore: true },
    body: JSON.stringify({ data }),
  });
  invalidatePresets();
}

export async function deleteSubTaskPreset(documentId: string): Promise<void> {
  await assertCanManagePresets();
  await strapiFetch(`/sub-task-presets/${documentId}`, {
    method: "DELETE",
    strapiCache: { noStore: true },
  });
  invalidatePresets();
}
