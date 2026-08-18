import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { FlagEditForm } from "@/components/settings/subtasks/flag-edit-form";
import { buttonVariants } from "@/components/ui/button";
import { findMaterialFlagById } from "@/lib/repos/material-flags";
import { listAllSubTaskCategories } from "@/lib/repos/sub-task-categories";
import { cn } from "@/lib/utils";

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
      <Link
        href="/settings/subtasks/flags"
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
      >
        <ArrowLeft aria-hidden />
        {tCommon("back")}
      </Link>
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
