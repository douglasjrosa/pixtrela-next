"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  templateTaskFormSchema,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import { cn } from "@/lib/utils";

export type TemplateFormValues = Pick<TemplateTaskFormInput, "name" | "code">;

export interface TemplateFormProps {
  mode: "create" | "edit";
  defaultValues: TemplateFormValues;
  isPending?: boolean;
  layout?: "standalone" | "embedded";
  formTitleId?: string;
  formId?: string;
  hideActions?: boolean;
  hideTitle?: boolean;
  onSubmit: (values: TemplateFormValues) => void;
  onInvalid?: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

const EMPTY: TemplateFormValues = { name: "", code: "" };

export function TemplateForm({
  mode,
  defaultValues = EMPTY,
  isPending = false,
  layout = "standalone",
  formTitleId = "template-form-title",
  formId,
  hideActions = false,
  hideTitle = false,
  onSubmit,
  onInvalid,
  onCancel,
  children,
}: TemplateFormProps) {
  const tCommon = useTranslations("common");
  const tTemplates = useTranslations("templates");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(
      templateTaskFormSchema.pick({ name: true, code: true }),
    ),
    defaultValues,
  });

  const title =
    mode === "create" ? tTemplates("newTemplate") : tTemplates("editTemplate");

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit, () => onInvalid?.())}
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        layout === "standalone" && "rounded-lg border p-4",
      )}
    >
      {hideTitle ? null : (
        <h2 id={formTitleId} className="sm:col-span-2 text-lg font-semibold">
          {title}
        </h2>
      )}

      <div className="space-y-2">
        <Label htmlFor={`${formTitleId}-name`}>{tTemplates("name")}</Label>
        <Input
          id={`${formTitleId}-name`}
          disabled={isPending}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${formTitleId}-code`}>{tTemplates("code")}</Label>
        <Input
          id={`${formTitleId}-code`}
          disabled={isPending}
          {...register("code")}
        />
        {errors.code ? (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        ) : null}
      </div>

      {children}

      {!hideActions ? (
        <div className="sm:col-span-2 flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onCancel}
            >
              {tCommon("cancel")}
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
