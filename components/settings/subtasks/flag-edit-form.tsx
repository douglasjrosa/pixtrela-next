"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { removeFlag, saveFlag } from "@/app/(app)/settings/subtasks/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { NATIVE_SELECT_CLASS_NAME } from "@/lib/ui/native-select";

export function FlagEditForm({
  documentId,
  initialCategoryId,
  initialIndex,
  occupied,
  categories,
}: {
  documentId: string;
  initialCategoryId: string;
  initialIndex: number;
  occupied: boolean;
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [index, setIndex] = useState(initialIndex);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave(): void {
    startTransition(async () => {
      try {
        await saveFlag(
          { subTaskCategoryId: categoryId, index },
          documentId,
        );
        showSuccessToast(t("flagSaved"));
        router.push("/settings/subtasks/flags");
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
        await removeFlag(documentId);
        showSuccessToast(t("flagDeleted"));
        setDeleteOpen(false);
        router.push("/settings/subtasks/flags");
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        const message =
          error instanceof Error && error.message === "flagOccupied"
            ? t("flagOccupiedError")
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
        <Label htmlFor="edit-flag-cat">{t("flagCategory")}</Label>
        <select
          id="edit-flag-cat"
          className={NATIVE_SELECT_CLASS_NAME}
          value={categoryId}
          required
          onChange={(event) => setCategoryId(event.target.value)}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-flag-index">{t("flagIndex")}</Label>
        <NumberInput
          id="edit-flag-index"
          min={1}
          value={index}
          required
          onChange={(event) =>
            setIndex(Number.parseInt(event.target.value, 10) || 1)
          }
        />
      </div>
      {occupied ? (
        <p className="text-sm text-muted-foreground">{t("flagOccupied")}</p>
      ) : null}
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
        title={t("editFlag")}
        description={tCommon("delete")}
        confirmLabel={tCommon("delete")}
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
        disabled={isPending}
      />
    </form>
  );
}
