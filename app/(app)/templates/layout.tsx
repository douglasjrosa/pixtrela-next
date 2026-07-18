import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { SectionTabs } from "@/components/navigation/section-tabs";
import { TEMPLATES_PAGE_HEIGHT_CLASS } from "@/components/templates/templates-page-layout";
import type { Role } from "@/lib/auth/nav";
import { canManageTemplates } from "@/lib/auth/permissions";

export default async function TemplatesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  const t = await getTranslations("templates");

  if (!canManageTemplates(role)) {
    return <ForbiddenMessage />;
  }

  return (
    <div className={`flex ${TEMPLATES_PAGE_HEIGHT_CLASS} flex-col gap-4 p-6`}>
      <div className="shrink-0 space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <SectionTabs
          ariaLabel={t("title")}
          items={[
            { href: "/templates/tasks", label: t("tasksTab") },
            { href: "/templates/subtasks", label: t("subtasksTab") },
          ]}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
