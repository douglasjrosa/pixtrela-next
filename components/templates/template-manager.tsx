"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { loadTemplateFromLegacy } from "@/app/(app)/templates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SHARING_TYPES,
} from "@/lib/schemas/sub-task";
import {
  templateTaskFormSchema,
  type TemplateSubTaskComponentInput,
  type TemplateTaskFormInput,
} from "@/lib/schemas/template-task";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface TemplateRow {
  documentId: string;
  name: string;
  code: string;
  subTask: TemplateSubTaskComponentInput[];
}

export interface TemplateManagerProps {
  templates: TemplateRow[];
  onCreate: (values: TemplateTaskFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: TemplateTaskFormInput) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
  canDelete: boolean;
}

const EMPTY_SUBTASK: TemplateSubTaskComponentInput = {
  name: "",
  qty: 1,
  sharingType: "duration",
  maxSameTimeWorkers: 1,
  index: 0,
  expectedTime: 0,
  dependencies: null,
};

const EMPTY_FORM: TemplateTaskFormInput = {
  name: "",
  code: "",
  subTask: [],
};

export function TemplateManager({
  templates,
  onCreate,
  onUpdate,
  onDelete,
  canDelete,
}: TemplateManagerProps) {
  const tCommon = useTranslations("common");
  const tTemplates = useTranslations("templates");
  const tSubtasks = useTranslations("subtasks");
  const tTasks = useTranslations("tasks");
  const tSharing = useTranslations("subtasks.sharingType");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    formState: { errors },
  } = useForm<TemplateTaskFormInput>({
    resolver: zodResolver(templateTaskFormSchema),
    defaultValues: EMPTY_FORM,
  });

  async function handleLoadTemplate(): Promise<void> {
    const code = getValues("code")?.trim();
    if (!code) {
      showErrorToast(tTemplates("loadTemplateMissingCode"));
      return;
    }
    setIsLoadingTemplate(true);
    try {
      const result = await loadTemplateFromLegacy(code);
      reset(result);
      setMessage(tTemplates("loadTemplateSuccess"));
      showSuccessToast(tTemplates("loadTemplateSuccess"));
    } catch {
      showErrorToast(tTemplates("loadTemplateError"));
    } finally {
      setIsLoadingTemplate(false);
    }
  }

  const { fields, append, remove } = useFieldArray({
    control,
    name: "subTask",
  });

  function startCreate(): void {
    setEditingId(null);
    reset(EMPTY_FORM);
    setMessage(null);
  }

  function startEdit(template: TemplateRow): void {
    setEditingId(template.documentId);
    reset({
      name: template.name,
      code: template.code,
      subTask: template.subTask.length > 0 ? template.subTask : [],
    });
    setMessage(null);
  }

  function onSubmit(values: TemplateTaskFormInput): void {
    startTransition(async () => {
      if (editingId) {
        await onUpdate(editingId, values);
      } else {
        await onCreate(values);
      }
      setMessage(tTemplates("saved"));
      setEditingId(null);
      reset(EMPTY_FORM);
    });
  }

  function handleDelete(documentId: string): void {
    if (!window.confirm(tCommon("delete"))) return;
    startTransition(async () => {
      await onDelete(documentId);
      setMessage(tTemplates("deleted"));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tTemplates("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tTemplates("newTemplate")}
        </Button>
      </div>

      {message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          {editingId ? tCommon("edit") : tTemplates("newTemplate")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="name">{tTemplates("name")}</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">{tTemplates("code")}</Label>
          <div className="flex gap-2">
            <Input id="code" {...register("code")} />
            <Button
              type="button"
              variant="outline"
              onClick={handleLoadTemplate}
              disabled={isLoadingTemplate}
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

        <div className="space-y-4 sm:col-span-2">
          <Label>{tTemplates("subtasks")}</Label>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-md border p-3 sm:grid-cols-2"
            >
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor={`subTask.${index}.name`}>{tSubtasks("name")}</Label>
                <Input id={`subTask.${index}.name`} {...register(`subTask.${index}.name`)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`subTask.${index}.qty`}>{tTasks("manage.qty")}</Label>
                <Input
                  id={`subTask.${index}.qty`}
                  type="number"
                  min={1}
                  {...register(`subTask.${index}.qty`, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`subTask.${index}.index`}>{tTasks("manage.index")}</Label>
                <Input
                  id={`subTask.${index}.index`}
                  type="number"
                  min={0}
                  {...register(`subTask.${index}.index`, { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`subTask.${index}.expectedTime`}>
                  {tSubtasks("expectedTime")}
                </Label>
                <Input
                  id={`subTask.${index}.expectedTime`}
                  type="number"
                  min={0}
                  {...register(`subTask.${index}.expectedTime`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`subTask.${index}.maxSameTimeWorkers`}>
                  {tSubtasks("maxSameTimeWorkers")}
                </Label>
                <Input
                  id={`subTask.${index}.maxSameTimeWorkers`}
                  type="number"
                  min={1}
                  {...register(`subTask.${index}.maxSameTimeWorkers`, {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`subTask.${index}.sharingType`}>
                  {tSubtasks("sharingTypeLabel")}
                </Label>
                <select
                  id={`subTask.${index}.sharingType`}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  {...register(`subTask.${index}.sharingType`)}
                >
                  {SHARING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {tSharing(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  {tCommon("delete")}
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...EMPTY_SUBTASK })}
          >
            {tTemplates("addSubtask")}
          </Button>
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
          {editingId ? (
            <Button type="button" variant="outline" onClick={startCreate}>
              {tCommon("cancel")}
            </Button>
          ) : null}
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
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => startEdit(template)}
                >
                  {template.name}
                </button>
              </td>
              <td>{template.code}</td>
              <td>{template.subTask.length}</td>
              <td>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(template.documentId)}
                  >
                    {tCommon("delete")}
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
