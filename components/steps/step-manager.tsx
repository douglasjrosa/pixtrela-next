"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stepFormSchema, type StepFormInput } from "@/lib/schemas/step";

export interface StepRow {
  documentId: string;
  name: string;
  index: number;
}

export interface StepManagerProps {
  steps: StepRow[];
  onCreate: (values: StepFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: StepFormInput) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
  canDelete: boolean;
}

const EMPTY_FORM: StepFormInput = { name: "", index: 0 };

export function StepManager({
  steps,
  onCreate,
  onUpdate,
  onDelete,
  canDelete,
}: StepManagerProps) {
  const tCommon = useTranslations("common");
  const tSteps = useTranslations("steps");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StepFormInput>({
    resolver: zodResolver(stepFormSchema),
    defaultValues: EMPTY_FORM,
  });

  function startCreate(): void {
    setEditingId(null);
    reset(EMPTY_FORM);
    setMessage(null);
  }

  function startEdit(step: StepRow): void {
    setEditingId(step.documentId);
    reset({ name: step.name, index: step.index });
    setMessage(null);
  }

  function onSubmit(values: StepFormInput): void {
    startTransition(async () => {
      if (editingId) {
        await onUpdate(editingId, values);
      } else {
        await onCreate(values);
      }
      setMessage(tSteps("saved"));
      setEditingId(null);
      reset(EMPTY_FORM);
    });
  }

  function handleDelete(documentId: string): void {
    if (!window.confirm(tCommon("delete"))) return;
    startTransition(async () => {
      await onDelete(documentId);
      setMessage(tSteps("deleted"));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tSteps("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tSteps("newStep")}
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
          {editingId ? tCommon("edit") : tSteps("newStep")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="name">{tSteps("name")}</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="index">{tSteps("index")}</Label>
          <Input
            id="index"
            type="number"
            min={0}
            {...register("index", { valueAsNumber: true })}
          />
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
            <th className="py-2">{tSteps("name")}</th>
            <th>{tSteps("index")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {steps.map((step) => (
            <tr key={step.documentId} className="border-b">
              <td className="py-2">
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => startEdit(step)}
                >
                  {step.name}
                </button>
              </td>
              <td>{step.index}</td>
              <td>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(step.documentId)}
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
