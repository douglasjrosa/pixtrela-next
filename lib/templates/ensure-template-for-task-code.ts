import { fetchBoxTemplateData } from "@/integrations/ribermax/rbx/rbx-client";
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

export type TemplateEnsureDebugStage = {
  stage: string;
  ms: number;
  detail?: string;
};

export type EnsureTemplateForTaskCodeResult = {
  templateId: string;
  source: "legacy" | "existing" | "payload" | "rbx";
  debugTrace?: TemplateEnsureDebugStage[];
};

/**
 * Ensures a template exists for `code` using fixed priority:
 * 1. Ancestral template with subtasks (versions, newest first) → clone
 * 2. Existing template for code (including empty shell) → reuse, ignore payload
 * 3. Create from CRM payload snapshot
 * 4. Fetch from legacy RBX when no payload was sent
 */
function pushDebugStage(
  trace: TemplateEnsureDebugStage[],
  startedAt: number,
  stage: string,
  detail?: string,
): void {
  trace.push({ stage, ms: Date.now() - startedAt, detail });
}

export async function ensureTemplateForTaskCode(input: {
  code: string;
  fallbackName: string;
  versions?: readonly string[];
  template?: BoxTemplateData | null;
  debugTrace?: TemplateEnsureDebugStage[];
}): Promise<EnsureTemplateForTaskCodeResult> {
  const startedAt = Date.now();
  const debugTrace = input.debugTrace ?? [];
  const code = input.code.trim();
  if (!code) {
    throw new Error("template_code_required");
  }

  const codes = resolveTemplateSourceCodes(code, input.versions ?? []);
  pushDebugStage(
    debugTrace,
    startedAt,
    "ensure_start",
    `code=${code} hasPayload=${Boolean(input.template)}`,
  );

  for (const ancestorCode of codes.slice(1)) {
    const ancestor = await findTemplateWithSubTasksByCode(ancestorCode);
    if (!ancestor) continue;
    const cloned = await cloneTemplateTaskByCode({
      fromCode: ancestorCode,
      toCode: code,
      name: input.fallbackName,
    });
    pushDebugStage(debugTrace, startedAt, "ensure_legacy_clone", ancestorCode);
    return { templateId: cloned.id, source: "legacy", debugTrace };
  }

  const existing = await findTemplateByCode(code);
  if (existing) {
    pushDebugStage(debugTrace, startedAt, "ensure_existing_shell", code);
    return { templateId: existing.id, source: "existing", debugTrace };
  }

  let templatePayload = input.template;
  let source: "payload" | "rbx" = "payload";

  if (!templatePayload) {
    const boxId = Number(code);
    if (!Number.isInteger(boxId) || boxId <= 0) {
      throw new Error("template_payload_required");
    }
    pushDebugStage(debugTrace, startedAt, "rbx_fetch_start", `boxId=${boxId}`);
    const rbxStartedAt = Date.now();
    templatePayload = await fetchBoxTemplateData(boxId);
    pushDebugStage(
      debugTrace,
      rbxStartedAt,
      "rbx_fetch_done",
      `subtasks=${templatePayload.subtasks.length}`,
    );
    source = "rbx";
  } else {
    pushDebugStage(
      debugTrace,
      startedAt,
      "ensure_payload_received",
      `subtasks=${templatePayload.subtasks.length}`,
    );
  }

  const buildStartedAt = Date.now();
  const draft = await buildTemplateFromBoxPayload(templatePayload);
  pushDebugStage(
    debugTrace,
    buildStartedAt,
    "build_template_from_payload",
    `subTasks=${draft.subTask?.length ?? 0}`,
  );
  const createStartedAt = Date.now();
  const created = await createTemplateTask({
    code: draft.code,
    name: draft.name || input.fallbackName,
    subTasks: toRepoSubTasks(draft.subTask ?? []),
  });
  pushDebugStage(debugTrace, createStartedAt, "create_template_task", code);
  pushDebugStage(debugTrace, startedAt, "ensure_done", source);
  return { templateId: created.id, source, debugTrace };
}
