"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const currencyPerSecondSchema = z.object({
  currencyPerSecond: z.number().min(0),
});

type CurrencyPerSecondInput = z.infer<typeof currencyPerSecondSchema>;

export interface CurrencyFormProps {
  currencyPerSecond: number;
  onSave: (values: CurrencyPerSecondInput) => void | Promise<void>;
}

export function CurrencyForm({ currencyPerSecond, onSave }: CurrencyFormProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CurrencyPerSecondInput>({
    resolver: zodResolver(currencyPerSecondSchema),
    defaultValues: { currencyPerSecond },
  });

  function onSubmit(values: CurrencyPerSecondInput): void {
    startTransition(async () => {
      await onSave(values);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-4">
      <h2 className="text-lg font-semibold">{tSettings("currency")}</h2>

      <div className="space-y-2">
        <Label htmlFor="currencyPerSecond">{tSettings("currencyPerSecond")}</Label>
        <Input
          id="currencyPerSecond"
          type="number"
          min={0}
          step="0.01"
          {...register("currencyPerSecond", { valueAsNumber: true })}
        />
        {errors.currencyPerSecond ? (
          <p className="text-sm text-destructive">
            {errors.currencyPerSecond.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isPending}>
        {tCommon("save")}
      </Button>
    </form>
  );
}
