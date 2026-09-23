import messages from "@/messages/pt-BR.json";

import { LOG_DESCRIPTION_MAX_LENGTH } from "@/lib/logs/constants";

export const AUDIT_VERBS = [
  "created",
  "updated",
  "archived",
  "reactivated",
  "deleted",
  "bulkArchived",
  "bulkDeleted",
  "bulkUpdated",
  "connection",
  "setting",
  "balance",
  "reorder",
] as const;

export type AuditVerb = (typeof AUDIT_VERBS)[number];

export type AuditEntity = keyof typeof messages.settings.logs.audit.entity;

type AuditVars = Record<string, string | number>;

const auditCopy = messages.settings.logs.audit;

export function fillAuditTemplate(template: string, vars: AuditVars): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = vars[key];
    return value == null ? "" : String(value);
  });
}

function clip(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, LOG_DESCRIPTION_MAX_LENGTH);
}

function resourceLabel(
  name?: string | null,
  code?: string | number | null,
): string {
  const safeName = name?.trim() ?? "";
  const safeCode =
    code == null || String(code).trim() === "" ? "" : String(code).trim();
  if (safeName && safeCode) {
    return fillAuditTemplate(auditCopy.labelWithCode, {
      name: safeName,
      code: safeCode,
    });
  }
  if (safeName) return safeName;
  if (safeCode) {
    return fillAuditTemplate(auditCopy.labelCodeOnly, { code: safeCode });
  }
  return "";
}

export type SuccessAuditInput = {
  verb: AuditVerb;
  entity: AuditEntity;
  name?: string | null;
  code?: string | number | null;
  before?: string | null;
  after?: string | null;
  quantity?: number;
  amount?: string | number | null;
};

export function successSentence(input: SuccessAuditInput): string {
  const entity = auditCopy.entity[input.entity];
  const label = resourceLabel(input.name, input.code);
  const before = input.before?.trim() ?? "";
  const after = input.after?.trim() ?? "";
  const change =
    before && after && before !== after
      ? fillAuditTemplate(auditCopy.change, { before, after })
      : "";
  const template = auditCopy[input.verb];
  return clip(
    fillAuditTemplate(template, {
      entity,
      label,
      change,
      quantity: input.quantity ?? 0,
      amount: input.amount ?? "",
      before,
      after,
    }),
  );
}

export function bugSentence(operation: string): string {
  return clip(
    fillAuditTemplate(auditCopy.bug, { operation: operation.trim() }),
  );
}

export function crmTasksSentence(count: number): string {
  return clip(fillAuditTemplate(auditCopy.crmTasks, { count }));
}
