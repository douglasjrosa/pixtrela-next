import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CategoryEditForm } from "@/components/settings/subtasks/category-edit-form";
import { buttonVariants } from "@/components/ui/button";
import { findSubTaskCategoryById } from "@/lib/repos/sub-task-categories";
import { cn } from "@/lib/utils";

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
      <Link
        href="/settings/subtasks/categories"
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
      >
        <ArrowLeft aria-hidden />
        {tCommon("back")}
      </Link>
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
