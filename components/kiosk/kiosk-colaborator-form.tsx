"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  kioskIdentifySchema,
  type KioskIdentifyInput,
} from "@/lib/schemas/kiosk-identify";

import { KioskActionButton } from "./kiosk-action-button";

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
    resolver: zodResolver(kioskIdentifySchema) as Resolver<KioskIdentifyInput>,
    defaultValues: { password: "" },
  });

  function handleFormSubmit(values: KioskIdentifyInput): void {
    void onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="mx-auto w-full max-w-sm space-y-4 px-1"
    >
      <div className="space-y-2">
        <Label htmlFor="code" className="text-base">
          {t("code")}
        </Label>
        <Input
          id="code"
          type="number"
          inputMode="numeric"
          min={0}
          className="h-14 rounded-2xl text-lg"
          {...register("code", { valueAsNumber: true })}
        />
        {errors.code ? (
          <p className="text-sm text-destructive">{errors.code.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">
          {t("password")}
        </Label>
        <Input
          id="password"
          type="password"
          className="h-14 rounded-2xl text-lg"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      <KioskActionButton type="submit" disabled={pending} actionVariant="gold">
        {t("enter")}
      </KioskActionButton>
    </form>
  );
}
