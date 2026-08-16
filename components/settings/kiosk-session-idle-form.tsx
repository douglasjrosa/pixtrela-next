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
  DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
  kioskSessionIdleSchema,
  type KioskSessionIdleInput,
} from "@/lib/schemas/kiosk-setting";

export interface KioskSessionIdleFormProps {
  sessionIdleSeconds: number;
  maxSimultaneousSubtaskIntervalSeconds?: number;
  onSave: (values: KioskSessionIdleInput) => void | Promise<void>;
}

export function KioskSessionIdleForm({
  sessionIdleSeconds,
  maxSimultaneousSubtaskIntervalSeconds =
    DEFAULT_KIOSK_LIVE_CHAIN_INTERVAL_SECONDS,
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
    defaultValues: {
      sessionIdleSeconds,
      maxSimultaneousSubtaskIntervalSeconds,
    },
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
        <div className="flex items-center gap-3">
          <Label htmlFor="sessionIdleSeconds" className="shrink-0">
            {tSettings("kioskSessionIdleSeconds")}
          </Label>
          <Input
            id="sessionIdleSeconds"
            className="flex-1"
            type="number"
            min={1}
            max={3600}
            step={1}
            {...register("sessionIdleSeconds", { valueAsNumber: true })}
          />
        </div>
        {errors.sessionIdleSeconds ? (
          <p className="text-sm text-destructive">
            {errors.sessionIdleSeconds.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxSimultaneousSubtaskIntervalSeconds">
          {tSettings("kioskLiveChainIntervalSeconds")}
        </Label>
        <Input
          id="maxSimultaneousSubtaskIntervalSeconds"
          type="number"
          min={0}
          max={86400}
          step={1}
          {...register("maxSimultaneousSubtaskIntervalSeconds", {
            valueAsNumber: true,
          })}
        />
        {errors.maxSimultaneousSubtaskIntervalSeconds ? (
          <p className="text-sm text-destructive">
            {errors.maxSimultaneousSubtaskIntervalSeconds.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isPending}>
        {tCommon("save")}
      </Button>
    </form>
  );
}
