"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { WorkdayTargetPicker } from "@/components/workdays/workday-target-picker";
import type { TargetOption } from "@/components/workdays/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugifyPanelName } from "@/lib/business/panel-slug";
import { panelFormSchema, type PanelFormInput } from "@/lib/schemas/panel";
import { cn } from "@/lib/utils";

export type PanelStepOption = {
  id: string;
  name: string;
};

export interface PanelFormModalProps {
  open: boolean;
  title: string;
  formKey: string;
  defaultValues: PanelFormInput;
  slugLocked: boolean;
  steps: PanelStepOption[];
  teams: TargetOption[];
  saving?: boolean;
  onClose: () => void;
  onSave: (values: PanelFormInput) => void;
}

export function PanelFormModal({
  open,
  ...props
}: PanelFormModalProps) {
  if (!open) return null;
  return <PanelFormModalContent key={props.formKey} {...props} />;
}

function PanelFormModalContent({
  title,
  defaultValues,
  slugLocked,
  steps,
  teams,
  saving = false,
  onClose,
  onSave,
}: Omit<PanelFormModalProps, "open" | "formKey">) {
  const tCommon = useTranslations("common");
  const tPanel = useTranslations("settings.panel");
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const formId = useId();
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PanelFormInput>({
    resolver: zodResolver(panelFormSchema) as Resolver<PanelFormInput>,
    defaultValues,
  });

  const nameValue = useWatch({ control, name: "name" });
  const teamIds = useWatch({ control, name: "teamIds" }) ?? [];

  useEffect(() => {
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
  }, [onClose, saving]);

  useEffect(() => {
    if (slugLocked || slugTouched) return;
    setValue("slug", slugifyPanelName(nameValue ?? ""), {
      shouldValidate: true,
    });
  }, [nameValue, slugLocked, slugTouched, setValue]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/50 p-4"
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

          <form id={formId} onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="panel-name">{tPanel("name")}</Label>
              <Input id="panel-name" disabled={saving} {...register("name")} />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="panel-slug">{tPanel("slug")}</Label>
              <Input
                id="panel-slug"
                disabled={saving || slugLocked}
                {...register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
              />
              <p className="text-xs text-muted-foreground">{tPanel("slugHint")}</p>
              {errors.slug ? (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="panel-step">{tPanel("step")}</Label>
              <select
                id="panel-step"
                disabled={saving}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input",
                  "bg-transparent px-3 text-sm text-foreground",
                )}
                {...register("stepId")}
              >
                {steps.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.name}
                  </option>
                ))}
              </select>
              {errors.stepId ? (
                <p className="text-sm text-destructive">
                  {errors.stepId.message}
                </p>
              ) : null}
            </div>

            <WorkdayTargetPicker
              id="panel-teams"
              label={tPanel("teams")}
              emptyLabel={tPanel("emptyTeams")}
              options={teams}
              value={teamIds}
              disabled={saving}
              error={errors.teamIds?.message}
              onChange={(next) =>
                setValue("teamIds", next, { shouldValidate: true })
              }
            />
          </form>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" form={formId} disabled={saving}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
