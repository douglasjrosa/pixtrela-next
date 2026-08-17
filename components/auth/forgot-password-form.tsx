"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { requestPasswordReset } from "@/app/login/password-reset-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetInput,
} from "@/lib/schemas/password-reset";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
  });

  async function onSubmit(values: RequestPasswordResetInput) {
    setFormError(null);
    const result = await requestPasswordReset(values);
    if (!result.ok) {
      setFormError(t("forgotPasswordInvalidEmail"));
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground" role="status">
          {t("forgotPasswordSent")}
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "w-full")}
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("forgotPasswordDescription")}
      </p>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
      </div>
      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {t("forgotPasswordSubmit")}
      </Button>
      <Link
        href="/login"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "w-full",
        )}
      >
        {t("backToLogin")}
      </Link>
    </form>
  );
}
