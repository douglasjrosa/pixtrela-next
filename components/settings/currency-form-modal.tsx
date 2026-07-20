"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { CurrencyMediaIcon } from "@/components/currency/currency-media-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  onUploadIcon: (formData: FormData) => Promise<number>;
}

export function CurrencyFormModal({
  open,
  title,
  formKey,
  defaultValues,
  initialIconUrl = null,
  saving = false,
  showDelete = false,
  onClose,
  onSave,
  onDelete,
  onUploadIcon,
}: CurrencyFormModalProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const titleId = useId();
  const formId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialIconUrl);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [, startUploadTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CurrencyFormInput>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues,
  });

  const iconMediaId = watch("iconMediaId");

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setPreviewUrl(initialIconUrl);
    setUploadMessage(null);
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

  function handleIconChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) return;

    setPreviewUrl(URL.createObjectURL(file));
    startUploadTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const id = await onUploadIcon(formData);
        setValue("iconMediaId", id);
        setUploadMessage(tSettings("currencyIconSelected"));
      } catch {
        setPreviewUrl(initialIconUrl);
        setValue("iconMediaId", defaultValues.iconMediaId ?? null);
        setUploadMessage(tSettings("currencyIconUploadFailed"));
      }
    });
  }

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

            <div className="space-y-2">
              <Label htmlFor="currency-icon">{tSettings("currencyIcon")}</Label>
              <Input
                id="currency-icon"
                type="file"
                accept="image/*"
                disabled={saving}
                onChange={handleIconChange}
              />
              <p className="text-xs text-muted-foreground">
                {tSettings("currencyIconHint")}
              </p>
              {previewUrl ? (
                <CurrencyMediaIcon url={previewUrl} className="size-10" />
              ) : null}
              {iconMediaId ? (
                <p className="text-xs text-muted-foreground">
                  {tSettings("currencyIconAttached")}
                </p>
              ) : null}
              {uploadMessage ? (
                <p className="text-xs text-muted-foreground" role="status">
                  {uploadMessage}
                </p>
              ) : null}
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
              <Input
                id="currency-per-second"
                type="number"
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
