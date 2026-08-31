import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
import { TemplatesLayoutClient } from "@/components/templates/templates-layout-client";
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
    <TemplatesLayoutClient
      title={t("title")}
      tabsAriaLabel={t("title")}
      tabItems={[
        { href: "/templates/tasks", label: t("tasksTab") },
        { href: "/templates/subtasks", label: t("subtasksTab") },
        { href: "/templates/actions", label: t("actionsTab") },
      ]}
    >
      {children}
    </TemplatesLayoutClient>
  );
}
