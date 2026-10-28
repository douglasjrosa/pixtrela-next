"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  createFlags,
  nextIndexForCategory,
  setMaterialFlagsFeatureEnabled,
} from "@/app/(app)/settings/subtasks/actions";
import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { SwitchField } from "@/components/ui/switch-field";
import { isMaterialFlagsDisabledError } from "@/lib/business/material-flags-feature";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { NATIVE_SELECT_CLASS_NAME } from "@/lib/ui/native-select";

const FORM_ID = "create-flag-form";

export function FlagPageHeader({
  categories,
  flagsEnabled,
}: {
  categories: { id: string; name: string }[];
  flagsEnabled: boolean;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(flagsEnabled);
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

  function handleEnabledChange(nextEnabled: boolean): void {
    const previous = enabled;
    setEnabled(nextEnabled);
    startTransition(async () => {
      try {
        await setMaterialFlagsFeatureEnabled(nextEnabled);
        showSuccessToast(
          nextEnabled ? t("flagsFeatureOn") : t("flagsFeatureOff"),
        );
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        setEnabled(previous);
        showErrorToast(t("error"));
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
        const message = isMaterialFlagsDisabledError(error)
          ? t("materialFlagsDisabled")
          : error instanceof Error && error.message === "flagIndexExists"
            ? t("flagIndexExists")
            : t("error");
        showErrorToast(message);
      }
    });
  }

  return (
    <>
      <div className="flex h-10 items-center gap-2">
        <SwitchField
          id="material-flags-enabled"
          label={t("flagsFeature")}
          checked={enabled}
          disabled={isPending}
          size="lg"
          className="h-10"
          onCheckedChange={handleEnabledChange}
        />
        {enabled ? (
          <AddNewButton label={t("newFlag")} onClick={() => setOpen(true)} />
        ) : null}
      </div>
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
