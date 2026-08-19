"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createFlags,
  nextIndexForCategory,
} from "@/app/(app)/settings/subtasks/actions";
import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { NATIVE_SELECT_CLASS_NAME } from "@/lib/ui/native-select";

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
  const [indexFrom, setIndexFrom] = useState(1);
  const [indexTo, setIndexTo] = useState(1);

  function close(): void {
    setOpen(false);
    setCategoryId("");
    setIndexFrom(1);
    setIndexTo(1);
  }

  function handleCategoryChange(nextId: string): void {
    setCategoryId(nextId);
    if (!nextId) return;
    startTransition(async () => {
      try {
        const nextIndex = await nextIndexForCategory(nextId);
        setIndexFrom(nextIndex);
        setIndexTo(nextIndex);
      } catch (error) {
        rethrowIfNavigationError(error);
      }
    });
  }

  function handleSubmit(): void {
    if (indexTo < indexFrom) {
      showErrorToast(t("flagIndexRangeInvalid"));
      return;
    }

    startTransition(async () => {
      try {
        const count = await createFlags({
          subTaskCategoryId: categoryId,
          indexFrom,
          indexTo,
        });
        showSuccessToast(
          count === 1 ? t("flagSaved") : t("flagsSaved", { count }),
        );
        close();
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        const message =
          error instanceof Error && error.message === "flagIndexExists"
            ? t("flagIndexExists")
            : t("error");
        showErrorToast(message);
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
          size="md"
          fillBody={false}
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
                className={NATIVE_SELECT_CLASS_NAME}
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
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("flagIndices")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="flag-index-from">{t("flagIndexFrom")}</Label>
                  <NumberInput
                    id="flag-index-from"
                    min={1}
                    value={indexFrom}
                    required
                    onChange={(event) =>
                      setIndexFrom(Number.parseInt(event.target.value, 10) || 1)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="flag-index-to">{t("flagIndexTo")}</Label>
                  <NumberInput
                    id="flag-index-to"
                    min={1}
                    value={indexTo}
                    required
                    onChange={(event) =>
                      setIndexTo(Number.parseInt(event.target.value, 10) || 1)
                    }
                  />
                </div>
              </div>
            </fieldset>
          </form>
        </FormModalShell>
      ) : null}
    </>
  );
}
