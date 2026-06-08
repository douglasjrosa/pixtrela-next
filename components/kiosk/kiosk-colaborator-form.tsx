"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  kioskIdentifySchema,
  type KioskIdentifyInput,
} from "@/lib/schemas/kiosk-identify";

export interface KioskColaboratorFormProps {
  onSubmit: (values: KioskIdentifyInput) => void | Promise<void>;
  pending?: boolean;
}

export function KioskColaboratorForm({
  onSubmit,
  pending,
}: KioskColaboratorFormProps) {
  const t = useTranslations("kiosk");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KioskIdentifyInput>({
    resolver: zodResolver(kioskIdentifySchema),
    defaultValues: { password: "" },
  });

  function handleFormSubmit(values: KioskIdentifyInput): void {
    void onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="mx-auto max-w-sm space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="code">{t("code")}</Label>
        <Input
          id="code"
          type="number"
          min={0}
          {...register("code", { valueAsNumber: true })}
        />
        {errors.code ? (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {t("enter")}
      </Button>
    </form>
  );
}
