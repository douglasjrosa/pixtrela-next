import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import {
  APP_LIST_PAGE_CHROME_CLASS,
  APP_LIST_PAGE_SHELL_CLASS,
  APP_LIST_PAGE_TITLE_CLASS,
  APP_SECTION_TABS_COMPACT_CLASS,
} from "@/components/layout/app-page-layout";
import { SectionTabs } from "@/components/navigation/section-tabs";
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
    <div className={APP_LIST_PAGE_SHELL_CLASS}>
      <div className={APP_LIST_PAGE_CHROME_CLASS}>
        <h1 className={APP_LIST_PAGE_TITLE_CLASS}>{t("title")}</h1>
        <SectionTabs
          ariaLabel={t("title")}
          className={APP_SECTION_TABS_COMPACT_CLASS}
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
