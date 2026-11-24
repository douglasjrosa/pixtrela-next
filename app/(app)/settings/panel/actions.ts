"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { auth } from "@/auth";
import type { Role } from "@/lib/auth/nav";
import { canManageProductionPanels } from "@/lib/auth/permissions";
import {
  allocateUniquePanelSlug,
  slugifyPanelName,
} from "@/lib/business/panel-slug";
import { isUniqueViolation } from "@/lib/db/pg-error";
import { auditSuccess } from "@/lib/logs/record-log";
import {
  archivePanels,
  createPanel as createPanelRepo,
  deletePanels,
  findPanelById,
  listPanelSlugs,
  reactivatePanels,
  updatePanel as updatePanelRepo,
} from "@/lib/repos/panels";
import { bulkDocumentIdsSchema } from "@/lib/schemas/bulk-ids";
import { parseArchiveReason } from "@/lib/schemas/archive-with-reason";
import { panelFormSchema, type PanelFormInput } from "@/lib/schemas/panel";

async function assertCanManage(): Promise<void> {
  const session = await auth();
  if (!canManageProductionPanels(session?.user?.role as Role | undefined)) {
    throw new Error("forbidden");
  }
}

function invalidatePanels(): void {
  revalidateTag("drizzle:panels", "default");
  revalidatePath("/settings/panel");
}

function rethrowSlugConflict(error: unknown): never {
  if (isUniqueViolation(error)) throw new Error("slugTaken");
  throw error;
}

export async function createPanel(raw: PanelFormInput): Promise<void> {
  await assertCanManage();
  const data = panelFormSchema.parse(raw);
  const taken = new Set(await listPanelSlugs());
  const suppliedSlug = data.slug?.trim() ?? "";
  const requested = suppliedSlug
    ? slugifyPanelName(suppliedSlug)
    : slugifyPanelName(data.name);
  const slug = allocateUniquePanelSlug(requested, taken);
  try {
    await createPanelRepo({
      name: data.name,
      slug,
      stepId: data.stepId,
      teamIds: data.teamIds,
    });
  } catch (error) {
    rethrowSlugConflict(error);
  }
  await auditSuccess({
    route: "/settings/panel",
    verb: "created",
    entity: "panel",
    name: data.name,
  });
  invalidatePanels();
}

export async function updatePanel(
  documentId: string,
  raw: PanelFormInput,
): Promise<void> {
  await assertCanManage();
  const data = panelFormSchema.parse(raw);
  const existing = await findPanelById(documentId);
  if (!existing) throw new Error("notFound");
  await updatePanelRepo({
    id: documentId,
    name: data.name,
    stepId: data.stepId,
    teamIds: data.teamIds,
  });
  await auditSuccess({
    route: "/settings/panel",
    verb: "updated",
    entity: "panel",
    name: data.name,
  });
  invalidatePanels();
}

export async function bulkArchivePanels(
  documentIds: string[],
  reason: string,
): Promise<void> {
  await assertCanManage();
  const ids = bulkDocumentIdsSchema.parse(documentIds);
  const text = parseArchiveReason(reason, ids.length);
  await archivePanels(ids, text);
  await auditSuccess({
    route: "/settings/panel",
    verb: ids.length > 1 ? "bulkArchived" : "archived",
    entity: ids.length > 1 ? "panels" : "panel",
    quantity: ids.length,
  });
  invalidatePanels();
}

export async function bulkReactivatePanels(
  documentIds: string[],
): Promise<void> {
  await assertCanManage();
  const ids = bulkDocumentIdsSchema.parse(documentIds);
  await reactivatePanels(ids);
  await auditSuccess({
    route: "/settings/panel",
    verb: ids.length > 1 ? "bulkReactivated" : "reactivated",
    entity: ids.length > 1 ? "panels" : "panel",
    quantity: ids.length,
  });
  invalidatePanels();
}

export async function bulkDeletePanels(documentIds: string[]): Promise<void> {
  await assertCanManage();
  const ids = bulkDocumentIdsSchema.parse(documentIds);
  await deletePanels(ids);
  await auditSuccess({
    route: "/settings/panel",
    verb: ids.length > 1 ? "bulkDeleted" : "deleted",
    entity: ids.length > 1 ? "panels" : "panel",
    quantity: ids.length,
  });
  invalidatePanels();
}
