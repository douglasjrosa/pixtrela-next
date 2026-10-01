import { fetchBoxTemplateData } from "@/integrations/ribermax/rbx/rbx-client";
import { buildTemplateFromBoxPayload } from "@/lib/templates/build-template-from-box-payload";
import type { BoxTemplateData } from "@/integrations/ribermax/rbx/rbx-types";
import { withTemplateCodeLock } from "@/lib/db/advisory-lock";
import type { Db } from "@/lib/db/client";
import { isUniqueViolation } from "@/lib/db/pg-error";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";
import {
  archiveActiveTemplateByCode,
  cloneTemplateTaskByCode,
  createTemplateTask,
  findTemplateByCode,
  findTemplateWithSubTasksByCode,
  type TemplateSubTaskInput,
} from "@/lib/repos/templates";
import { buildTemplateVersionSupersededReason } from "@/lib/templates/template-version-superseded-reason";

function dependencyIndexesFrom(
  dependencies: TemplateSubTaskComponentInput["dependencies"],
): number[] {
  if (!Array.isArray(dependencies)) return [];
  return dependencies.filter(
    (value): value is number => typeof value === "number",
  );
}

function toRepoSubTasks(
  subTasks: TemplateSubTaskComponentInput[],
): TemplateSubTaskInput[] {
  return subTasks.map((row, index) => ({
    name: row.name,
    qty: row.qty,
    sharingType: row.sharingType,
    maxSameTimeWorkers: row.maxSameTimeWorkers,
    index,
    expectedTime: row.expectedTime,
    dependencyIndexes: dependencyIndexesFrom(row.dependencies),
    linkedToPrevious: row.linkedToPrevious ?? false,
    subTaskCategoryId: row.subTaskCategoryId ?? null,
  }));
}

/**
 * Codes to try: current code, then versions newest → oldest.
 */
export function resolveTemplateSourceCodes(
  code: string,
  versions: readonly string[] = [],
): string[] {
  const current = code.trim();
  const seen = new Set<string>(current ? [current] : []);
  const codes = current ? [current] : [];

  for (let i = versions.length - 1; i >= 0; i -= 1) {
    const raw = versions[i];
    if (typeof raw !== "string" && typeof raw !== "number") continue;
    const next = String(raw).trim();
    if (!next || !/^\d+$/.test(next) || seen.has(next)) continue;
    seen.add(next);
    codes.push(next);
  }

  return codes;
}

export type EnsureTemplateForTaskCodeResult = {
  templateId: string;
  source: "legacy" | "existing" | "payload" | "rbx";
};

async function findCloneableAncestorCode(
  code: string,
  versions: readonly string[],
  db?: Db,
): Promise<string | null> {
  const codes = resolveTemplateSourceCodes(code, versions);
  for (const ancestorCode of codes.slice(1)) {
    const ancestor = await findTemplateWithSubTasksByCode(ancestorCode, db);
    if (ancestor) return ancestorCode;
  }
  return null;
}

async function cloneFromAncestorCode(
  ancestorCode: string,
  code: string,
  fallbackName: string,
  db?: Db,
): Promise<EnsureTemplateForTaskCodeResult> {
  const cloned = await cloneTemplateTaskByCode(
    {
      fromCode: ancestorCode,
      toCode: code,
      name: fallbackName,
    },
    db,
  );
  await archiveActiveTemplateByCode(
    ancestorCode,
    buildTemplateVersionSupersededReason(code),
    db,
  );
  return { templateId: cloned.id, source: "legacy" };
}

async function createFromPayload(input: {
  code: string;
  fallbackName: string;
  templatePayload: BoxTemplateData;
  source: "payload" | "rbx";
  db?: Db;
}): Promise<EnsureTemplateForTaskCodeResult> {
  const draft = await buildTemplateFromBoxPayload(input.templatePayload);
  try {
    const created = await createTemplateTask(
      {
        code: draft.code,
        name: draft.name || input.fallbackName,
        subTasks: toRepoSubTasks(draft.subTask ?? []),
      },
      input.db,
    );
    return { templateId: created.id, source: input.source };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const winner = await findTemplateByCode(input.code, input.db);
    if (winner?.active) {
      return { templateId: winner.id, source: "existing" };
    }
    throw error;
  }
}

async function ensureUnderLock(
  input: {
    code: string;
    fallbackName: string;
    versions: readonly string[];
    templatePayload: BoxTemplateData | null;
    source: "payload" | "rbx";
  },
  db: Db,
): Promise<EnsureTemplateForTaskCodeResult> {
  const ancestorCode = await findCloneableAncestorCode(
    input.code,
    input.versions,
    db,
  );
  if (ancestorCode) {
    return cloneFromAncestorCode(
      ancestorCode,
      input.code,
      input.fallbackName,
      db,
    );
  }

  const existing = await findTemplateByCode(input.code, db);
  if (existing?.active) {
    return { templateId: existing.id, source: "existing" };
  }

  if (!input.templatePayload) {
    throw new Error("template_payload_required");
  }

  return createFromPayload({
    code: input.code,
    fallbackName: input.fallbackName,
    templatePayload: input.templatePayload,
    source: input.source,
    db,
  });
}

async function loadCreatePayload(input: {
  code: string;
  template?: BoxTemplateData | null;
}): Promise<{ templatePayload: BoxTemplateData; source: "payload" | "rbx" }> {
  if (input.template) {
    return { templatePayload: input.template, source: "payload" };
  }
  const boxId = Number(input.code);
  if (!Number.isInteger(boxId) || boxId <= 0) {
    throw new Error("template_payload_required");
  }
  return {
    templatePayload: await fetchBoxTemplateData(boxId),
    source: "rbx",
  };
}

/**
 * Ensures a template exists for `code` using fixed priority:
 * 1. Ancestral template with subtasks (versions, newest first) → clone
 * 2. Existing template for code (including empty shell) → reuse, ignore payload
 * 3. Create from CRM payload snapshot
 * 4. Fetch from legacy RBX when no payload was sent
 *
 * Concurrent posts for the same code take a Postgres advisory lock so only
 * one create/clone runs; losers reuse the winner (or recover from unique).
 */
export async function ensureTemplateForTaskCode(input: {
  code: string;
  fallbackName: string;
  versions?: readonly string[];
  template?: BoxTemplateData | null;
}): Promise<EnsureTemplateForTaskCodeResult> {
  const code = input.code.trim();
  if (!code) {
    throw new Error("template_code_required");
  }

  const versions = input.versions ?? [];
  const existing = await findTemplateByCode(code);
  if (existing?.active) {
    return { templateId: existing.id, source: "existing" };
  }

  const ancestorPeek = await findCloneableAncestorCode(code, versions);
  const loaded = ancestorPeek
    ? { templatePayload: input.template ?? null, source: "payload" as const }
    : await loadCreatePayload({ code, template: input.template });

  return withTemplateCodeLock(code, (db) =>
    ensureUnderLock(
      {
        code,
        fallbackName: input.fallbackName,
        versions,
        templatePayload: loaded.templatePayload,
        source: loaded.source,
      },
      db,
    ),
  );
}
