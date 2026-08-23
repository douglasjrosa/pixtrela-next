import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CategoryEditForm } from "@/components/settings/subtasks/category-edit-form";
import { BackLink } from "@/components/navigation/back-link";
import { findSubTaskCategoryById } from "@/lib/repos/sub-task-categories";

interface PageProps {
  params: Promise<{ documentId: string }>;
}

export default async function SettingsCategoryDetailPage({ params }: PageProps) {
  const { documentId } = await params;
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");
  const category = await findSubTaskCategoryById(documentId);
  if (!category) notFound();

  return (
    <div className="space-y-6">
      <BackLink href="/settings/subtasks/categories">{tCommon("back")}</BackLink>
      <h2 className="font-display text-xl font-bold">{t("editCategory")}</h2>
      <CategoryEditForm
        documentId={category.id}
        initialName={category.name}
        initialRef={category.ref}
        initialDescription={category.description ?? ""}
      />
    </div>
  );
}
