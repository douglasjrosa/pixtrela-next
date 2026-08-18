"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  nextIndexForCategory,
  saveFlag,
} from "@/app/(app)/settings/subtasks/actions";
import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

const FORM_ID = "create-flag-form";

export function FlagPageHeader({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("");
  const [index, setIndex] = useState(1);

  function close(): void {
    setOpen(false);
    setCategoryId("");
    setIndex(1);
  }

  function handleCategoryChange(nextId: string): void {
    setCategoryId(nextId);
    if (!nextId) return;
    startTransition(async () => {
      try {
        const nextIndex = await nextIndexForCategory(nextId);
        setIndex(nextIndex);
      } catch (error) {
        rethrowIfNavigationError(error);
      }
    });
  }

  function handleSubmit(): void {
    startTransition(async () => {
      try {
        await saveFlag({ subTaskCategoryId: categoryId, index });
        showSuccessToast(t("flagSaved"));
        close();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(t("error"));
      }
    });
  }

  return (
    <>
      <AddNewButton label={t("newFlag")} onClick={() => setOpen(true)} />
      {open ? (
        <FormModalShell
          open
          title={t("newFlag")}
          onClose={close}
          disabled={isPending}
          footerEnd={
            <Button type="submit" form={FORM_ID} disabled={isPending}>
              {tCommon("save")}
            </Button>
          }
        >
          <form
            id={FORM_ID}
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="flag-cat">{t("flagCategory")}</Label>
              <select
                id="flag-cat"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={categoryId}
                required
                onChange={(event) => handleCategoryChange(event.target.value)}
              >
                <option value="">{t("noCategory")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="flag-index">{t("flagIndex")}</Label>
              <Input
                id="flag-index"
                type="number"
                min={1}
                value={index}
                required
                onChange={(event) =>
                  setIndex(Number.parseInt(event.target.value, 10) || 1)
                }
              />
            </div>
          </form>
        </FormModalShell>
      ) : null}
    </>
  );
}
