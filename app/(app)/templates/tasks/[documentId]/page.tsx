import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { buttonVariants } from "@/components/ui/button";
import { TemplateEditor } from "@/components/templates/template-editor";
import { mapTemplateComponentsToRows } from "@/lib/business/template-subtask-map";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";
import {
  findTemplateById,
  listTemplateSubTasks,
} from "@/lib/repos/templates";
import type { TemplateSubTaskComponentInput } from "@/lib/schemas/template-task";
import { cn } from "@/lib/utils";

function TemplatesBackLink({ label }: { label: string }) {
  return (
    <Link
      href="/templates/tasks"
      className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
    >
      <ArrowLeft aria-hidden />
      {label}
    </Link>
  );
}

interface PageProps {
  params: Promise<{ documentId: string }>;
}

async function loadTemplate(
  documentId: string,
): Promise<{
  documentId: string;
  name: string;
  code: string;
  subTask: TemplateSubTaskComponentInput[] | null;
} | null> {
  try {
    const template = await findTemplateById(documentId);
    if (!template || !template.active) return null;
    const subTasks = await listTemplateSubTasks(documentId);
    return {
      documentId: template.id,
      name: template.name,
      code: template.code,
      subTask: subTasks.map((row) => ({
        name: row.name,
        qty: row.qty,
        sharingType: row.sharingType,
        maxSameTimeWorkers: row.maxSameTimeWorkers,
        index: row.index,
        expectedTime: row.expectedTime,
        dependencies:
          row.dependencyIndexes.length > 0 ? row.dependencyIndexes : null,
        linkedToPrevious: row.linkedToPrevious,
      })),
    };
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
        <TemplatesBackLink label={tCommon("back")} />
        <p className="text-destructive">{tTemplates("error")}</p>
      </section>
    );
  }

  const subtasks = mapTemplateComponentsToRows(template.subTask ?? []);

  return (
    <section className="min-h-0 flex-1 space-y-8 overflow-y-auto">
      <TemplatesBackLink label={tCommon("back")} />

      <TemplateEditor
        documentId={documentId}
        template={{ name: template.name, code: template.code }}
        initialSubtasks={subtasks}
      />
    </section>
  );
}
