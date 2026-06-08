import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { TemplateManager, type TemplateRow } from "@/components/templates/template-manager";
import type { Role } from "@/lib/auth/nav";
import { canDeleteTasks, canManageTemplates } from "@/lib/auth/permissions";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

import {
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from "./actions";

interface StrapiList<T> {
  data: T[];
}

interface TemplateSubTaskEntity {
  name?: string;
  qty?: number;
  sharingType?: TemplateSubTaskComponentInput["sharingType"];
  maxSameTimeWorkers?: number;
  index?: number;
  expectedTime?: number;
  dependencies?: unknown;
}

interface TemplateEntity {
  documentId: string;
  name: string;
  code: string;
  subTask?: TemplateSubTaskEntity[] | null;
}

function mapSubTaskComponents(
  rows: TemplateSubTaskEntity[] | null | undefined,
): TemplateSubTaskComponentInput[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    name: row.name ?? "",
    qty: row.qty ?? 1,
    sharingType: row.sharingType ?? "duration",
    maxSameTimeWorkers: row.maxSameTimeWorkers ?? 1,
    index: row.index ?? 0,
    expectedTime: row.expectedTime ?? 0,
    dependencies: row.dependencies ?? null,
  }));
}

async function loadTemplates(): Promise<TemplateRow[]> {
  try {
    const res = await strapiFetch<StrapiList<TemplateEntity>>(
      "/template-tasks",
      { strapiCache: { tags: [STRAPI_TAGS.templateTasks], revalidate: 60 } },
      {
        fields: ["documentId", "name", "code"],
        populate: { subTask: true },
        sort: "name:asc",
      },
    );
    return res.data.map((template) => ({
      documentId: template.documentId,
      name: template.name,
      code: template.code,
      subTask: mapSubTaskComponents(template.subTask),
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function TemplatesPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  const templates = await loadTemplates();

  return (
    <section className="p-6">
      <TemplateManager
        templates={templates}
        onCreate={createTemplate}
        onUpdate={updateTemplate}
        onDelete={deleteTemplate}
        canDelete={canDeleteTasks(role)}
      />
    </section>
  );
}
