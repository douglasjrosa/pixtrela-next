"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changeOwnPasswordSchema,
  type ChangeOwnPasswordInput,
} from "@/lib/schemas/profile";
import { cn } from "@/lib/utils";

export type ProfilePasswordFormHandle = {
  submit: () => Promise<{ ok: true } | { ok: false; error: string }>;
  reset: () => void;
};

export interface ProfilePasswordFormProps {
  disabled?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (
    input: ChangeOwnPasswordInput,
  ) =>
    | { ok: true }
    | { ok: false; error: string }
    | Promise<{ ok: true } | { ok: false; error: string }>;
}

const EMPTY_PASSWORD: ChangeOwnPasswordInput = {
  currentPassword: "",
  password: "",
  passwordConfirmation: "",
};

export const ProfilePasswordForm = forwardRef<
  ProfilePasswordFormHandle,
  ProfilePasswordFormProps
>(function ProfilePasswordForm(
  { disabled = false, onDirtyChange, onSave },
  ref,
) {
  const t = useTranslations("profile");
  const [expanded, setExpanded] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ChangeOwnPasswordInput>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: EMPTY_PASSWORD,
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
              reset(EMPTY_PASSWORD);
              resolve({ ok: true });
              return;
            }
            if (result.error === "invalidCurrent") {
              setError("currentPassword", { message: "invalidCurrent" });
            } else if (result.error === "passwordMismatch") {
              setError("passwordConfirmation", {
                message: "passwordMismatch",
              });
            } else if (result.error === "passwordUnchanged") {
              setError("password", { message: "passwordUnchanged" });
            }
            resolve({ ok: false, error: result.error });
          },
          () => {
            resolve({ ok: false, error: "invalid" });
          },
        )();
      });
    },
    reset() {
      reset(EMPTY_PASSWORD);
    },
  }));

  function toggleExpanded(): void {
    setExpanded((value) => !value);
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 text-left",
          "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-expanded={expanded}
        onClick={toggleExpanded}
      >
        <KeyRound className="size-5 shrink-0" aria-hidden strokeWidth={1.5} />
        <h2 className="text-lg font-semibold">{t("passwordTitle")}</h2>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
        aria-hidden={!expanded}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="profile-current-password">
                {t("currentPassword")}
              </Label>
              <Input
                id="profile-current-password"
                type="password"
                autoComplete="current-password"
                disabled={disabled || isSubmitting || !expanded}
                tabIndex={expanded ? undefined : -1}
                {...register("currentPassword")}
              />
              {errors.currentPassword ? (
                <p className="text-sm text-destructive" role="alert">
                  {t("passwordInvalidCurrent")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-new-password">{t("newPassword")}</Label>
              <Input
                id="profile-new-password"
                type="password"
                autoComplete="new-password"
                disabled={disabled || isSubmitting || !expanded}
                tabIndex={expanded ? undefined : -1}
                {...register("password")}
              />
              {errors.password?.message === "passwordUnchanged" ? (
                <p className="text-sm text-destructive" role="alert">
                  {t("passwordUnchanged")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-confirm-password">
                {t("confirmPassword")}
              </Label>
              <Input
                id="profile-confirm-password"
                type="password"
                autoComplete="new-password"
                disabled={disabled || isSubmitting || !expanded}
                tabIndex={expanded ? undefined : -1}
                {...register("passwordConfirmation")}
              />
              {errors.passwordConfirmation?.message === "passwordMismatch" ? (
                <p className="text-sm text-destructive" role="alert">
                  {t("passwordMismatch")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});
