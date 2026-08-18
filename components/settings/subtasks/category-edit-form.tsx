"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { removeCategory, saveCategory } from "@/app/(app)/settings/subtasks/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export function CategoryEditForm({
  documentId,
  initialName,
  initialRef,
  initialDescription,
}: {
  documentId: string;
  initialName: string;
  initialRef: string;
  initialDescription: string;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [ref, setRef] = useState(initialRef);
  const [description, setDescription] = useState(initialDescription);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave(): void {
    startTransition(async () => {
      try {
        await saveCategory({ name, ref, description }, documentId);
        showSuccessToast(t("categorySaved"));
        router.push("/settings/subtasks/categories");
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  function handleDelete(): void {
    startTransition(async () => {
      try {
        await removeCategory(documentId);
        showSuccessToast(t("categoryDeleted"));
        setDeleteOpen(false);
        router.push("/settings/subtasks/categories");
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        const message =
          error instanceof Error && error.message === "categoryHasFlags"
            ? t("categoryHasFlags")
            : error instanceof Error && error.message === "categoryInUse"
              ? t("categoryInUse")
              : t("error");
        showErrorToast(message);
      }
    });
  }

  return (
    <form
      className="max-w-lg space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
    >
      <div className="space-y-1">
        <Label htmlFor="edit-cat-name">{t("categoryName")}</Label>
        <Input
          id="edit-cat-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-cat-ref">{t("categoryRef")}</Label>
        <Input
          id="edit-cat-ref"
          value={ref}
          onChange={(event) => setRef(event.target.value)}
          required
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-cat-desc">{t("categoryDescription")}</Label>
        <Input
          id="edit-cat-desc"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {tCommon("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => setDeleteOpen(true)}
        >
          {tCommon("delete")}
        </Button>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        title={t("editCategory")}
        description={tCommon("delete")}
        confirmLabel={tCommon("delete")}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
        disabled={isPending}
      />
    </form>
  );
}
