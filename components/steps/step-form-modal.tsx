"use client";

import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stepFormSchema, type StepFormInput } from "@/lib/schemas/step";

export interface StepFormModalProps {
  open: boolean;
  title: string;
  formKey: string;
  defaultValues: StepFormInput;
  saving?: boolean;
  onClose: () => void;
  onSave: (values: StepFormInput) => void;
}

export function StepFormModal({
  open,
  title,
  formKey,
  defaultValues,
  saving = false,
  onClose,
  onSave,
}: StepFormModalProps) {
  const tCommon = useTranslations("common");
  const tSteps = useTranslations("steps");
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const formId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StepFormInput>({
    resolver: zodResolver(stepFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    // Reset only when the modal opens or switches create/edit target.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formKey drives reset
  }, [open, formKey, reset]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !saving) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={saving ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={
          "relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg " +
          "border bg-background p-6 shadow-lg"
        }
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          ref={closeButtonRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-3 right-3"
          disabled={saving}
          aria-label={tCommon("close")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </Button>

        <div className="space-y-4">
          <h2 id={titleId} className="pr-8 text-lg font-semibold">
            {title}
          </h2>

          <form
            id={formId}
            onSubmit={handleSubmit(onSave)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="step-name">{tSteps("name")}</Label>
              <Input id="step-name" disabled={saving} {...register("name")} />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="step-index">{tSteps("index")}</Label>
              <Input
                id="step-index"
                type="number"
                min={0}
                disabled={saving}
                {...register("index", { valueAsNumber: true })}
              />
            </div>
          </form>

          <div className="flex justify-end">
            <Button type="submit" form={formId} disabled={saving}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
