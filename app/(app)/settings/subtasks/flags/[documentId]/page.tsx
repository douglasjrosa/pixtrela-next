import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FlagEditForm } from "@/components/settings/subtasks/flag-edit-form";
import { BackLink } from "@/components/navigation/back-link";
import { findMaterialFlagById } from "@/lib/repos/material-flags";
import { listAllSubTaskCategories } from "@/lib/repos/sub-task-categories";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function SettingsFlagDetailPage({ params }: PageProps) {
  const { documentId } = await params;
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");
  const flag = await findMaterialFlagById(documentId);
  if (!flag) notFound();
  const categories = await listAllSubTaskCategories();

  return (
    <div className="space-y-6">
      <BackLink href="/settings/subtasks/flags">{tCommon("back")}</BackLink>
      <h2 className="font-display text-xl font-bold">{t("editFlag")}</h2>
      <FlagEditForm
        documentId={flag.id}
        initialCategoryId={flag.categoryId}
        initialIndex={flag.index}
        occupied={flag.occupied}
        categories={categories}
      />
    </div>
  );
}
