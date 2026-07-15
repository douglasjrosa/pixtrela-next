"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { createTemplate, deleteTemplate } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  templateTaskFormSchema,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface TemplateListRow {
  documentId: string;
  name: string;
  code: string;
  subTaskCount: number;
}

export interface TemplateManagerProps {
  templates: TemplateListRow[];
}

const EMPTY_FORM: Pick<TemplateTaskFormInput, "name" | "code"> = {
  name: "",
  code: "",
};

export function TemplateManager({ templates }: TemplateManagerProps) {
  const tCommon = useTranslations("common");
  const tTemplates = useTranslations("templates");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formKey, setFormKey] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Pick<TemplateTaskFormInput, "name" | "code">>({
    resolver: zodResolver(
      templateTaskFormSchema.pick({ name: true, code: true }),
    ),
    defaultValues: EMPTY_FORM,
  });

  function handleCreate(values: Pick<TemplateTaskFormInput, "name" | "code">): void {
    startTransition(async () => {
      try {
        const documentId = await createTemplate(values);
        showSuccessToast(tTemplates("saved"));
        setFormKey((current) => current + 1);
        router.push(`/templates/tasks/${documentId}`);
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("loadTemplateError"));
      }
    });
  }

  function handleDelete(documentId: string): void {
    if (!window.confirm(tCommon("delete"))) return;
    startTransition(async () => {
      try {
        await deleteTemplate(documentId);
        showSuccessToast(tTemplates("deleted"));
        router.refresh();
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tTemplates("loadTemplateError"));
      }
    });
  }

  return (
    <div className="space-y-6">
      <form
        key={formKey}
        onSubmit={handleSubmit(handleCreate)}
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          {tTemplates("newTemplate")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="template-create-name">{tTemplates("name")}</Label>
          <Input id="template-create-name" {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-create-code">{tTemplates("code")}</Label>
          <Input id="template-create-code" {...register("code")} />
          {errors.code ? (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
        </div>
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">{tTemplates("name")}</th>
            <th>{tTemplates("code")}</th>
            <th>{tTemplates("subtasks")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {templates.map((template) => (
            <tr key={template.documentId} className="border-b">
              <td className="py-2">
                <Link
                  href={`/templates/tasks/${template.documentId}`}
                  className="hover:underline"
                >
                  {template.name}
                </Link>
              </td>
              <td>{template.code}</td>
              <td>{template.subTaskCount}</td>
              <td>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(template.documentId)}
                >
                  {tCommon("delete")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
