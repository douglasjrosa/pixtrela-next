"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import {
  loadTemplateFromLegacy,
  updateTemplate,
} from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  mapTemplateRowsToComponents,
  type TemplateSubTaskRow,
} from "@/lib/business/template-subtask-map";
import {
  templateTaskFormSchema,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

import { TemplateSubTaskManager } from "./template-subtask-manager";

const TEMPLATE_DETAIL_FORM_ID = "template-detail-form";

export interface TemplateEditorProps {
  documentId: string;
  template: Pick<TemplateTaskFormInput, "name" | "code">;
  initialSubtasks: TemplateSubTaskRow[];
}

export function TemplateEditor({
  documentId,
  template,
  initialSubtasks,
}: TemplateEditorProps) {
  const tCommon = useTranslations("common");
  const tTemplates = useTranslations("templates");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingTemplate, startLoadTransition] = useTransition();
  const [subtasks, setSubtasks] = useState(initialSubtasks);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Pick<TemplateTaskFormInput, "name" | "code">>({
    resolver: zodResolver(
      templateTaskFormSchema.pick({ name: true, code: true }),
    ),
    defaultValues: template,
  });

  useEffect(() => {
    setSubtasks(initialSubtasks);
  }, [initialSubtasks]);

  function handleSave(values: Pick<TemplateTaskFormInput, "name" | "code">): void {
    startTransition(async () => {
      try {
        await updateTemplate(documentId, {
          name: values.name,
          code: values.code,
          subTask: mapTemplateRowsToComponents(subtasks),
        });
        showSuccessToast(tTemplates("saved"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("loadTemplateError"));
      }
    });
  }

  function handleLoadTemplate(): void {
    const code = getValues("code")?.trim();
    if (!code) {
      showErrorToast(tTemplates("loadTemplateMissingCode"));
      return;
    }

    startLoadTransition(async () => {
      try {
        await loadTemplateFromLegacy(documentId, code);
        showSuccessToast(tTemplates("loadTemplateSuccess"));
        router.refresh();
      } catch {
        showErrorToast(tTemplates("loadTemplateError"));
      }
    });
  }

  return (
    <div className="space-y-8 pb-24">
      <form
        id={TEMPLATE_DETAIL_FORM_ID}
        onSubmit={handleSubmit(handleSave)}
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">{tCommon("edit")}</h2>

        <div className="space-y-2">
          <Label htmlFor="template-name">{tTemplates("name")}</Label>
          <Input id="template-name" disabled={isPending} {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-code">{tTemplates("code")}</Label>
          <div className="flex gap-2">
            <Input id="template-code" disabled={isPending} {...register("code")} />
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadTemplate}
              disabled={isLoadingTemplate || isPending}
            >
              {isLoadingTemplate
                ? tTemplates("loadingTemplate")
                : tTemplates("loadTemplate")}
            </Button>
          </div>
          {errors.code ? (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          ) : null}
        </div>
      </form>

      <TemplateSubTaskManager
        subtasks={subtasks}
        onSubtasksChange={setSubtasks}
        disabled={isPending}
      />

      <div className="fixed right-6 bottom-6 z-50">
        <Button
          type="submit"
          form={TEMPLATE_DETAIL_FORM_ID}
          size="lg"
          className="shadow-lg"
          disabled={isPending}
        >
          {tCommon("save")}
        </Button>
      </div>
    </div>
  );
}
