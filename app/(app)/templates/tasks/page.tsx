import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  TemplateManager,
  type TemplateListRow,
} from "@/components/templates/template-manager";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

interface StrapiList<T> {
  data: T[];
}

interface TemplateEntity {
  documentId: string;
  name: string;
  code: string;
  subTask?: unknown[] | null;
}

async function loadTemplates(): Promise<TemplateListRow[]> {
  try {
    const res = await strapiFetch<StrapiList<TemplateEntity>>(
      "/template-tasks",
      { strapiCache: { tags: [STRAPI_TAGS.templateTasks], revalidate: 60 } },
      {
        fields: ["documentId", "name", "code"],
        populate: { subTask: { fields: ["name"] } },
        sort: "name:asc",
      },
    );
    return res.data.map((template) => ({
      documentId: template.documentId,
      name: template.name,
      code: template.code,
      subTaskCount: template.subTask?.length ?? 0,
    }));
  } catch (error) {
    rethrowIfNavigationError(error);
    return [];
  }
}

export default async function TemplateTasksPage() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  const templates = await loadTemplates();

  return <TemplateManager templates={templates} />;
}
