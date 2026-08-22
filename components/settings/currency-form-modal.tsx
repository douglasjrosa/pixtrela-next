"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { MediaImageField } from "@/components/media/media-image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import type { MediaAssetRecord } from "@/lib/repos/media";
import {
  currencyFormSchema,
  type CurrencyFormInput,
} from "@/lib/schemas/currency";

export interface CurrencyFormModalProps {
  open: boolean;
  title: string;
  formKey: string;
  defaultValues: CurrencyFormInput;
  initialIconUrl?: string | null;
  saving?: boolean;
  showDelete?: boolean;
  onClose: () => void;
  onSave: (values: CurrencyFormInput) => void;
  onDelete?: () => void;
  onListImages: () => Promise<MediaAssetRecord[]>;
  onUploadImage: (formData: FormData) => Promise<MediaAssetRecord>;
}

export function CurrencyFormModal({
  open,
  ...props
}: CurrencyFormModalProps) {
  if (!open) return null;
  return <CurrencyFormModalContent key={props.formKey} open {...props} />;
}

function CurrencyFormModalContent({
  title,
  defaultValues,
  initialIconUrl = null,
  saving = false,
  showDelete = false,
  onClose,
  onSave,
  onDelete,
  onListImages,
  onUploadImage,
}: Omit<CurrencyFormModalProps, "open"> & { open: true }) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const titleId = useId();
  const formId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialIconUrl);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CurrencyFormInput>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues,
  });

  const iconMediaId = useWatch({ control, name: "iconMediaId" });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

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

  function handleIconSelect(asset: MediaAssetRecord): void {
    setValue("iconMediaId", asset.id);
    setPreviewUrl(asset.browserUrl);
  }

  function handleIconRemove(): void {
    setValue("iconMediaId", null);
    setPreviewUrl(null);
  }

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

          <form
            id={formId}
            onSubmit={handleSubmit(onSave)}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="currency-name">{tSettings("currencyName")}</Label>
              <Input
                id="currency-name"
                disabled={saving}
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{tSettings("currencyIcon")}</Label>
              <MediaImageField
                selectedId={iconMediaId}
                previewUrl={previewUrl}
                disabled={saving}
                attachedLabel={tSettings("currencyIconAttached")}
                onSelect={handleIconSelect}
                onRemove={handleIconRemove}
                onListImages={onListImages}
                onUploadImage={onUploadImage}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-title">
                {tSettings("currencyTitle")}
              </Label>
              <Input
                id="currency-title"
                disabled={saving}
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-plural-title">
                {tSettings("currencyPluralTitle")}
              </Label>
              <Input
                id="currency-plural-title"
                disabled={saving}
                {...register("pluralTitle")}
              />
              {errors.pluralTitle ? (
                <p className="text-sm text-destructive">
                  {errors.pluralTitle.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="currency-per-second">
                {tSettings("currencyPerSecond")}
              </Label>
              <NumberInput
                id="currency-per-second"
                min={0}
                step="0.01"
                disabled={saving}
                {...register("currencyPerSecond", { valueAsNumber: true })}
              />
              {errors.currencyPerSecond ? (
                <p className="text-sm text-destructive">
                  {errors.currencyPerSecond.message}
                </p>
              ) : null}
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {showDelete && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={onDelete}
              >
                {tCommon("delete")}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" form={formId} disabled={saving}>
              {tCommon("save")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
