"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { saveCategory } from "@/app/(app)/settings/subtasks/actions";
import { AddNewButton } from "@/components/ui/add-new-button";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

const FORM_ID = "create-category-form";

export function CategoryPageHeader() {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [ref, setRef] = useState("");
  const [description, setDescription] = useState("");

  function close(): void {
    setOpen(false);
    setName("");
    setRef("");
    setDescription("");
  }

  function handleSubmit(): void {
    startTransition(async () => {
      try {
        await saveCategory({ name, ref, description });
        showSuccessToast(t("categorySaved"));
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
      <AddNewButton label={t("newCategory")} onClick={() => setOpen(true)} />
      {open ? (
        <FormModalShell
          open
          title={t("newCategory")}
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
              <Label htmlFor="cat-name">{t("categoryName")}</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-ref">{t("categoryRef")}</Label>
              <Input
                id="cat-ref"
                value={ref}
                onChange={(event) => setRef(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cat-desc">{t("categoryDescription")}</Label>
              <Input
                id="cat-desc"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </form>
        </FormModalShell>
      ) : null}
    </>
  );
}
