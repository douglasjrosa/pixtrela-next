"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  kioskColaboratorPasswordSchema,
  type KioskColaboratorPasswordInput,
} from "@/lib/schemas/kiosk-colaborator-password";

export interface KioskColaboratorPasswordFormProps {
  colaboratorName: string;
  disabled?: boolean;
  onCancel: () => void;
  onSave: (input: KioskColaboratorPasswordInput) => boolean | Promise<boolean>;
}

export function KioskColaboratorPasswordForm({
  colaboratorName,
  disabled = false,
  onCancel,
  onSave,
}: KioskColaboratorPasswordFormProps) {
  const t = useTranslations("kiosk");
  const tCommon = useTranslations("common");
  const tUsers = useTranslations("users");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KioskColaboratorPasswordInput>({
    resolver: zodResolver(kioskColaboratorPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: KioskColaboratorPasswordInput): Promise<void> {
    const saved = await onSave(values);
    if (saved) {
      reset();
    }
  }

  return (
    <form
      className="space-y-4 rounded-lg border bg-card p-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <h2 className="text-lg font-semibold">{colaboratorName}</h2>

      <div className="space-y-2">
        <Label htmlFor="kiosk-colaborator-password">{tUsers("password")}</Label>
        <Input
          id="kiosk-colaborator-password"
          type="password"
          autoComplete="new-password"
          disabled={disabled || isSubmitting}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive" role="alert">
            {t("staffPasswordInvalid")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="kiosk-colaborator-confirm-password">
          {t("staffConfirmPassword")}
        </Label>
        <Input
          id="kiosk-colaborator-confirm-password"
          type="password"
          autoComplete="new-password"
          disabled={disabled || isSubmitting}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword?.message === "passwordMismatch" ? (
          <p className="text-sm text-destructive" role="alert">
            {t("staffPasswordMismatch")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={disabled || isSubmitting}>
          {tCommon("save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isSubmitting}
          onClick={onCancel}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
