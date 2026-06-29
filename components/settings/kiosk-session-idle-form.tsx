"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import {
  kioskSessionIdleSchema,
  type KioskSessionIdleInput,
} from "@/lib/schemas/kiosk-setting";

export interface KioskSessionIdleFormProps {
  sessionIdleSeconds: number;
  onSave: (values: KioskSessionIdleInput) => void | Promise<void>;
}

export function KioskSessionIdleForm({
  sessionIdleSeconds,
  onSave,
}: KioskSessionIdleFormProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KioskSessionIdleInput>({
    resolver: zodResolver(kioskSessionIdleSchema),
    defaultValues: { sessionIdleSeconds },
  });

  function onSubmit(values: KioskSessionIdleInput): void {
    startTransition(async () => {
      try {
        await onSave(values);
        showSuccessToast(tSettings("saved"));
      } catch (error) {
        rethrowIfNavigationError(error);
        showErrorToast(tSettings("error"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
      <h2 className="text-lg font-semibold">{tSettings("kioskSession")}</h2>

      <div className="space-y-2">
        <Label htmlFor="sessionIdleSeconds">
          {tSettings("kioskSessionIdleSeconds")}
        </Label>
        <Input
          id="sessionIdleSeconds"
          type="number"
          min={1}
          max={3600}
          step={1}
          {...register("sessionIdleSeconds", { valueAsNumber: true })}
        />
        {errors.sessionIdleSeconds ? (
          <p className="text-sm text-destructive">
            {errors.sessionIdleSeconds.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isPending}>
        {tCommon("save")}
      </Button>
    </form>
  );
}
