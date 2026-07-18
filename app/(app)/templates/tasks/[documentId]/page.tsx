import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { TemplateEditor } from "@/components/templates/template-editor";
import { mapTemplateComponentsToRows } from "@/lib/business/template-subtask-map";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";
import { STRAPI_TAGS, strapiFetch } from "@/lib/strapi";

interface StrapiOne<T> {
  data: T;
}

interface TemplateEntity {
  documentId: string;
  name: string;
  code: string;
  subTask?: TemplateSubTaskComponentInput[] | null;
}

interface PageProps {
  params: Promise<{ documentId: string }>;
}

async function loadTemplate(
  documentId: string,
): Promise<TemplateEntity | null> {
  try {
    const res = await strapiFetch<StrapiOne<TemplateEntity>>(
      `/template-tasks/${documentId}`,
      { strapiCache: { tags: [STRAPI_TAGS.templateTasks], revalidate: 30 } },
      {
        fields: ["documentId", "name", "code"],
        populate: { subTask: true },
      },
    );
    return res.data;
  } catch (error) {
    rethrowIfNavigationError(error);
    return null;
  }
}

export default async function TemplateTaskDetailPage({ params }: PageProps) {
  const { documentId } = await params;
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const tCommon = await getTranslations("common");
  const tTemplates = await getTranslations("templates");

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  const template = await loadTemplate(documentId);

  if (!template) {
    return (
      <section className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <Link href="/templates/tasks" className="text-sm hover:underline">
          {tCommon("back")}
        </Link>
        <p className="text-destructive">{tTemplates("error")}</p>
      </section>
    );
  }

  const subtasks = mapTemplateComponentsToRows(template.subTask ?? []);

  return (
    <section className="min-h-0 flex-1 space-y-8 overflow-y-auto">
      <Link href="/templates/tasks" className="text-sm hover:underline">
        {tCommon("back")}
      </Link>

      <TemplateEditor
        documentId={documentId}
        template={{ name: template.name, code: template.code }}
        initialSubtasks={subtasks}
      />
    </section>
  );
}
