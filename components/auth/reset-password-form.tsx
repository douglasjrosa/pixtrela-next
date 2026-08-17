"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { resetPassword } from "@/app/login/password-reset-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/schemas/password-reset";

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    const result = await resetPassword(values);
    if (!result.ok) {
      if (result.error === "passwordMismatch") {
        setFormError(t("resetPasswordMismatch"));
        return;
      }
      if (result.error === "expired") {
        setFormError(t("resetPasswordExpired"));
        return;
      }
      setFormError(t("resetPasswordFailed"));
      return;
    }
    router.replace("/login?reset=success");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register("token")} />
      <div className="space-y-2">
        <Label htmlFor="password">{t("newPassword")}</Label>
        <Input id="password" type="password" {...register("password")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordConfirmation">{t("confirmNewPassword")}</Label>
        <Input
          id="passwordConfirmation"
          type="password"
          {...register("passwordConfirmation")}
        />
      </div>
      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {t("resetPasswordSubmit")}
      </Button>
      <Link
        href="/login"
        className={cn(buttonVariants({ variant: "ghost" }), "w-full")}
      >
        {t("backToLogin")}
      </Link>
    </form>
  );
}
