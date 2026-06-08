"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { awardFormSchema, type AwardFormInput } from "@/lib/schemas/award";

export interface CurrencyOption {
  documentId: string;
  name: string;
  title?: string | null;
}

export interface AwardRow {
  documentId: string;
  name: string;
  title?: string | null;
  description?: string | null;
  warnings?: string | null;
  imageId?: number | null;
  imageUrl?: string | null;
  values: AwardFormInput["values"];
}

export interface AwardManagerProps {
  awards: AwardRow[];
  currencies: CurrencyOption[];
  onCreate: (values: AwardFormInput) => void | Promise<void>;
  onUpdate: (documentId: string, values: AwardFormInput) => void | Promise<void>;
  onDelete: (documentId: string) => void | Promise<void>;
  onUploadImage: (formData: FormData) => Promise<number>;
  canDelete: boolean;
}

function defaultValues(currencies: CurrencyOption[]): AwardFormInput {
  const defaultCurrencyId = currencies[0]?.documentId ?? "";
  return {
    name: "",
    title: "",
    description: "",
    warnings: "",
    imageId: null,
    values: [{ numberOf: 1, currencyDocumentId: defaultCurrencyId }],
  };
}

function currencyLabel(currency: CurrencyOption): string {
  return currency.title ?? currency.name;
}

function formatValueRow(
  entry: AwardFormInput["values"][number],
  currencies: CurrencyOption[],
): string {
  const currency = currencies.find(
    (option) => option.documentId === entry.currencyDocumentId,
  );
  const label = currency ? currencyLabel(currency) : "—";
  return `${entry.numberOf} ${label}`;
}

export function AwardManager({
  awards,
  currencies,
  onCreate,
  onUpdate,
  onDelete,
  onUploadImage,
  canDelete,
}: AwardManagerProps) {
  const tCommon = useTranslations("common");
  const tAwards = useTranslations("awards");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const emptyForm = defaultValues(currencies);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AwardFormInput>({
    resolver: zodResolver(awardFormSchema),
    defaultValues: emptyForm,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "values",
  });

  const imageId = watch("imageId");

  function startCreate(): void {
    setEditingId(null);
    reset(emptyForm);
    setPreviewUrl(null);
    setMessage(null);
  }

  function startEdit(award: AwardRow): void {
    setEditingId(award.documentId);
    reset({
      name: award.name,
      title: award.title ?? "",
      description: award.description ?? "",
      warnings: award.warnings ?? "",
      imageId: award.imageId ?? null,
      values:
        award.values.length > 0
          ? award.values
          : [{ numberOf: 1, currencyDocumentId: currencies[0]?.documentId ?? "" }],
    });
    setPreviewUrl(award.imageUrl ?? null);
    setMessage(null);
  }

  function onSubmit(values: AwardFormInput): void {
    startTransition(async () => {
      if (editingId) {
        await onUpdate(editingId, values);
      } else {
        await onCreate(values);
      }
      setMessage(tAwards("saved"));
      setEditingId(null);
      reset(emptyForm);
      setPreviewUrl(null);
    });
  }

  function handleDelete(documentId: string): void {
    if (!window.confirm(tCommon("delete"))) return;
    startTransition(async () => {
      await onDelete(documentId);
      setMessage(tAwards("deleted"));
    });
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const id = await onUploadImage(formData);
        setValue("imageId", id);
        setMessage(tAwards("imageSelected"));
      } catch {
        setPreviewUrl(null);
        setValue("imageId", null);
        setMessage(tAwards("imageUploadFailed"));
      }
    });
  }

  const textareaClass = cn(
    "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2",
    "text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
    "disabled:opacity-50",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tAwards("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tAwards("newAward")}
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
          {editingId ? tCommon("edit") : tAwards("newAward")}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="name">{tAwards("name")}</Label>
          <Input id="name" {...register("name")} />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{tAwards("titleField")}</Label>
          <Input id="title" {...register("title")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{tAwards("description")}</Label>
          <textarea
            id="description"
            className={textareaClass}
            {...register("description")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="warnings">{tAwards("warnings")}</Label>
          <textarea
            id="warnings"
            className={textareaClass}
            {...register("warnings")}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="image">{tAwards("image")}</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            disabled={isPending}
            onChange={handleImageChange}
          />
          <p className="text-xs text-muted-foreground">{tAwards("imageHint")}</p>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt=""
              role="presentation"
              className="mt-2 h-24 w-24 rounded-md border object-cover"
            />
          ) : null}
          {imageId ? (
            <p className="text-xs text-muted-foreground">
              {tAwards("imageAttached")}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 sm:col-span-2">
          <Label>{tAwards("values")}</Label>
          {fields.map((field, index) => (
            <div key={field.id} className="flex flex-wrap gap-2">
              <Input
                type="number"
                min={1}
                className="w-28"
                aria-label={tAwards("numberOf")}
                {...register(`values.${index}.numberOf`, { valueAsNumber: true })}
              />
              <select
                className="flex h-9 min-w-40 flex-1 rounded-md border border-input bg-transparent px-3 text-sm"
                aria-label={tAwards("currency")}
                {...register(`values.${index}.currencyDocumentId`)}
              >
                {currencies.map((currency) => (
                  <option key={currency.documentId} value={currency.documentId}>
                    {currencyLabel(currency)}
                  </option>
                ))}
              </select>
              {fields.length > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  {tCommon("delete")}
                </Button>
              ) : null}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                numberOf: 1,
                currencyDocumentId: currencies[0]?.documentId ?? "",
              })
            }
          >
            {tAwards("addValue")}
          </Button>
        </div>

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending || currencies.length === 0}>
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
            <th className="py-2">{tAwards("name")}</th>
            <th>{tAwards("starCost")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {awards.map((award) => (
            <tr key={award.documentId} className="border-b">
              <td className="py-2">
                <button
                  type="button"
                  className="text-left hover:underline"
                  onClick={() => startEdit(award)}
                >
                  {award.name}
                </button>
              </td>
              <td>
                {award.values.length > 0
                  ? award.values
                      .map((entry) => formatValueRow(entry, currencies))
                      .join(", ")
                  : "—"}
              </td>
              <td>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(award.documentId)}
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
