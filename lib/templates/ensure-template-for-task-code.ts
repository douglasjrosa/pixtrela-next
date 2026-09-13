import { buildTemplateFromBoxPayload } from "@/lib/templates/build-template-from-box-payload";
import type { BoxTemplateData } from "@/integrations/ribermax/rbx/rbx-types";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";
import {
  cloneTemplateTaskByCode,
  createTemplateTask,
  findTemplateByCode,
  findTemplateWithSubTasksByCode,
  type TemplateSubTaskInput,
} from "@/lib/repos/templates";

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
  source: "legacy" | "existing" | "payload";
};

/**
 * Ensures a template exists for `code` using fixed priority:
 * 1. Ancestral template with subtasks (versions, newest first) → clone
 * 2. Existing template for code (including empty shell) → reuse, ignore payload
 * 3. Create from payload template
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

  const codes = resolveTemplateSourceCodes(code, input.versions ?? []);

  for (const ancestorCode of codes.slice(1)) {
    const ancestor = await findTemplateWithSubTasksByCode(ancestorCode);
    if (!ancestor) continue;
    const cloned = await cloneTemplateTaskByCode({
      fromCode: ancestorCode,
      toCode: code,
      name: input.fallbackName,
    });
    return { templateId: cloned.id, source: "legacy" };
  }

  const existing = await findTemplateByCode(code);
  if (existing) {
    return { templateId: existing.id, source: "existing" };
  }

  if (!input.template) {
    throw new Error("template_payload_required");
  }

  const draft = await buildTemplateFromBoxPayload(input.template);
  const created = await createTemplateTask({
    code: draft.code,
    name: draft.name || input.fallbackName,
    subTasks: toRepoSubTasks(draft.subTask ?? []),
  });
  return { templateId: created.id, source: "payload" };
}
