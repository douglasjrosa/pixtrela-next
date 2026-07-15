import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { ForbiddenMessage } from "@/components/auth/forbidden-message";
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
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <SectionTabs
          ariaLabel={t("title")}
          items={[
            { href: "/templates/tasks", label: t("tasksTab") },
            { href: "/templates/subtasks", label: t("subtasksTab") },
          ]}
        />
      </div>
      {children}
    </div>
  );
}
