"use client";

import {
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { awardFormSchema, type AwardFormInput } from "@/lib/schemas/award";

import { AwardsListView } from "./awards-list-view";
import { AwardsToolbar } from "./awards-toolbar";
import {
  currencyLabel,
  type AwardRow,
  type CurrencyOption,
} from "./types";

export type { AwardRow, CurrencyOption } from "./types";

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

function toFormValues(
  award: AwardRow,
  currencies: CurrencyOption[],
): AwardFormInput {
  return {
    name: award.name,
    title: award.title ?? "",
    description: award.description ?? "",
    warnings: award.warnings ?? "",
    imageId: award.imageId ?? null,
    values:
      award.values.length > 0
        ? award.values
        : [{ numberOf: 1, currencyDocumentId: currencies[0]?.documentId ?? "" }],
  };
}

interface AwardFormDialogProps {
  editingAward: AwardRow | null;
  currencies: CurrencyOption[];
  isPending: boolean;
  showDelete: boolean;
  onClose: () => void;
  onSubmit: (values: AwardFormInput) => void;
  onDelete?: () => void;
  onUploadImage: (formData: FormData) => Promise<number>;
}

function AwardFormDialog({
  editingAward,
  currencies,
  isPending,
  showDelete,
  onClose,
  onSubmit,
  onDelete,
  onUploadImage,
}: AwardFormDialogProps) {
  const tCommon = useTranslations("common");
  const tAwards = useTranslations("awards");
  const isEditing = editingAward !== null;
  const formTitleId = "award-form-title";
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    editingAward?.imageUrl ?? null,
  );
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [, startUploadTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AwardFormInput>({
    resolver: zodResolver(awardFormSchema),
    defaultValues: isEditing
      ? toFormValues(editingAward, currencies)
      : defaultValues(currencies),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "values",
  });

  const imageId = watch("imageId");

  function handleImageChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    startUploadTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const id = await onUploadImage(formData);
        setValue("imageId", id);
        setUploadMessage(tAwards("imageSelected"));
      } catch {
        setPreviewUrl(editingAward?.imageUrl ?? null);
        setValue("imageId", editingAward?.imageId ?? null);
        setUploadMessage(tAwards("imageUploadFailed"));
      }
    });
  }

  const textareaClass = cn(
    "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2",
    "text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed",
    "disabled:opacity-50",
  );
  const formId = "award-form";

  return (
    <FormModalShell
      open
      title={isEditing ? tAwards("editAward") : tAwards("newAward")}
      titleId={formTitleId}
      onClose={onClose}
      disabled={isPending}
      footerStart={
        showDelete && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={onDelete}
          >
            {tCommon("delete")}
          </Button>
        ) : undefined
      }
      footerEnd={
        <Button
          type="submit"
          form={formId}
          disabled={isPending || currencies.length === 0}
        >
          {tCommon("save")}
        </Button>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 sm:grid-cols-2"
      >
        {uploadMessage ? (
          <p
            role="status"
            className="sm:col-span-2 text-sm text-muted-foreground"
          >
            {uploadMessage}
          </p>
        ) : null}

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
                className={
                  "flex h-9 min-w-40 flex-1 rounded-md border border-input " +
                  "bg-transparent px-3 text-sm"
                }
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
      </form>
    </FormModalShell>
  );
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
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const editingAward =
    awards.find((award) => award.documentId === editingId) ?? null;

  function closeForm(): void {
    setFormOpen(false);
    setEditingId(null);
    setDeleteOpen(false);
  }

  function startCreate(): void {
    setEditingId(null);
    setMessage(null);
    setDeleteOpen(false);
    setFormOpen(true);
  }

  function startEdit(award: AwardRow): void {
    setEditingId(award.documentId);
    setMessage(null);
    setDeleteOpen(false);
    setFormOpen(true);
  }

  function onSubmit(values: AwardFormInput): void {
    startTransition(async () => {
      if (editingId) {
        await onUpdate(editingId, values);
      } else {
        await onCreate(values);
      }
      setMessage(tAwards("saved"));
      closeForm();
      router.refresh();
    });
  }

  function handleConfirmDelete(): void {
    if (!editingId) return;
    startTransition(async () => {
      await onDelete(editingId);
      setMessage(tAwards("deleted"));
      closeForm();
      router.refresh();
    });
  }

  const formDialogKey = editingId ?? "new";
  const query = nameQuery.trim().toLowerCase();
  const visibleAwards =
    query.length === 0
      ? awards
      : awards.filter((award) => award.name.toLowerCase().includes(query));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 max-[500px]:gap-2">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h1 className="text-2xl font-bold max-[500px]:text-lg">{tAwards("title")}</h1>
        <Button type="button" variant="outline" onClick={startCreate}>
          {tAwards("newAward")}
        </Button>
      </div>

      <AwardsToolbar value={nameQuery} onChange={setNameQuery} />

      {message ? (
        <p role="status" className="shrink-0 text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      {formOpen ? (
        <AwardFormDialog
          key={formDialogKey}
          editingAward={editingAward}
          currencies={currencies}
          isPending={isPending}
          showDelete={Boolean(canDelete && editingAward)}
          onClose={closeForm}
          onSubmit={onSubmit}
          onDelete={() => setDeleteOpen(true)}
          onUploadImage={onUploadImage}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title={tAwards("deleteTitle")}
        description={tAwards("deleteConfirm")}
        confirmLabel={tCommon("delete")}
        disabled={isPending}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AwardsListView
            awards={visibleAwards}
            currencies={currencies}
            onOpen={startEdit}
          />
        </div>
      </div>
    </div>
  );
}
