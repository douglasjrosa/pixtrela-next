"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateOwnPersonalSchema,
  type UpdateOwnPersonalInput,
} from "@/lib/schemas/profile";

export type ProfilePersonalFormHandle = {
  submit: () => Promise<
    | { ok: true; values: UpdateOwnPersonalInput }
    | { ok: false; error: string }
  >;
  resetWith: (values: UpdateOwnPersonalInput) => void;
};

export interface ProfilePersonalFormProps {
  defaultValues: UpdateOwnPersonalInput;
  disabled?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (
    input: UpdateOwnPersonalInput,
  ) =>
    | { ok: true }
    | { ok: false; error: string }
    | Promise<{ ok: true } | { ok: false; error: string }>;
}

export const ProfilePersonalForm = forwardRef<
  ProfilePersonalFormHandle,
  ProfilePersonalFormProps
>(function ProfilePersonalForm(
  { defaultValues, disabled = false, onDirtyChange, onSave },
  ref,
) {
  const t = useTranslations("profile");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateOwnPersonalInput>({
    resolver: zodResolver(updateOwnPersonalSchema),
    defaultValues,
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  useImperativeHandle(ref, () => ({
    async submit() {
      return new Promise((resolve) => {
        void handleSubmit(
          async (values) => {
            const result = await onSave(values);
            if (result.ok) {
              reset(values);
              resolve({ ok: true, values });
              return;
            }
            if (result.error === "invalidEmail") {
              setError("email", { message: "invalidEmail" });
            } else if (result.error === "invalidPhone") {
              setError("phone", { message: "invalidPhone" });
            } else if (result.error === "emailTaken") {
              setError("email", { message: "emailTaken" });
            }
            resolve({ ok: false, error: result.error });
          },
          () => {
            resolve({ ok: false, error: "invalid" });
          },
        )();
      });
    },
    resetWith(values) {
      reset(values);
    },
  }));

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-4">
      <h2 className="text-lg font-semibold">{t("personalTitle")}</h2>

      <div className="space-y-2">
        <Label htmlFor="profile-first-name">{t("firstName")}</Label>
        <Input
          id="profile-first-name"
          autoComplete="given-name"
          disabled={disabled || isSubmitting}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive" role="alert">
            {t("invalidFirstName")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-last-name">{t("lastName")}</Label>
        <Input
          id="profile-last-name"
          autoComplete="family-name"
          disabled={disabled || isSubmitting}
          {...register("lastName")}
        />
        {errors.lastName ? (
          <p className="text-sm text-destructive" role="alert">
            {t("invalidLastName")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-email">{t("email")}</Label>
        <Input
          id="profile-email"
          type="email"
          autoComplete="email"
          disabled={disabled || isSubmitting}
          {...register("email")}
        />
        {errors.email?.message === "emailTaken" ? (
          <p className="text-sm text-destructive" role="alert">
            {t("emailTaken")}
          </p>
        ) : errors.email ? (
          <p className="text-sm text-destructive" role="alert">
            {t("invalidEmail")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profile-phone">{t("phone")}</Label>
        <Input
          id="profile-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled || isSubmitting}
          {...register("phone")}
        />
        {errors.phone ? (
          <p className="text-sm text-destructive" role="alert">
            {t("invalidPhone")}
          </p>
        ) : null}
      </div>
    </section>
  );
});
