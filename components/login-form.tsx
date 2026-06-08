"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import type { Role } from "@/lib/auth/nav";

import { loginSchema, type LoginInput } from "@/lib/schemas/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function resolvePostLoginDestination(
  role: Role | undefined,
  userId: string | undefined,
  callbackUrl: string | null,
): string {
  if (role === "kiosk") return KIOSK_HOME_PATH;
  if (role === "colaborator" && userId) return `/${userId}`;
  if (callbackUrl?.startsWith("/")) return callbackUrl;
  return "/";
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    const result = await signIn("credentials", { ...values, redirect: false });
    if (result?.error) {
      setFormError(t("invalidCredentials"));
      return;
    }
    const session = await getSession();
    const destination = resolvePostLoginDestination(
      session?.user?.role as Role | undefined,
      session?.user?.id,
      callbackUrl,
    );
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login">{t("login")}</Label>
        <Input id="login" placeholder={t("loginPlaceholder")} {...register("login")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" type="password" {...register("password")} />
      </div>
      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {t("signIn")}
      </Button>
    </form>
  );
}
