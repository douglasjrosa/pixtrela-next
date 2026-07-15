"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import {
  currencyRatesFormSchema,
  type CurrencyRatesFormInput,
} from "@/lib/schemas/currency-rates";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface CurrencyRate {
  documentId: string;
  title: string;
  pluralTitle: string;
  currencyPerSecond: number;
}

export interface CurrencyFormProps {
  currencies: CurrencyRate[];
  onSave: (values: CurrencyRatesFormInput) => void | Promise<void>;
}

function resolveCurrencyLabel(currency: CurrencyRate): string {
  if (currency.pluralTitle.trim().length > 0) return currency.pluralTitle;
  if (currency.title.trim().length > 0) return currency.title;
  return currency.documentId;
}

export function CurrencyForm({ currencies, onSave }: CurrencyFormProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CurrencyRatesFormInput>({
    resolver: zodResolver(currencyRatesFormSchema),
    defaultValues: {
      rates: currencies.map((currency) => ({
        documentId: currency.documentId,
        currencyPerSecond: currency.currencyPerSecond,
      })),
    },
  });

  function onSubmit(values: CurrencyRatesFormInput): void {
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
    <section className="max-w-sm space-y-4">
      <h2 className="text-lg font-semibold">{tSettings("currency")}</h2>

      {currencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tSettings("noCurrencies")}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {currencies.map((currency, index) => {
            const label = tSettings("currencyPerSecondFor", {
              currency: resolveCurrencyLabel(currency),
            });
            const fieldError = errors.rates?.[index]?.currencyPerSecond;

            return (
              <div className="space-y-2" key={currency.documentId}>
                <input
                  type="hidden"
                  {...register(`rates.${index}.documentId`)}
                />
                <div className="flex items-center gap-3">
                  <Label
                    htmlFor={`currency-rate-${currency.documentId}`}
                    className="shrink-0"
                  >
                    {label}
                  </Label>
                  <Input
                    id={`currency-rate-${currency.documentId}`}
                    className="flex-1"
                    type="number"
                    min={0}
                    step="0.01"
                    {...register(`rates.${index}.currencyPerSecond`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                {fieldError ? (
                  <p className="text-sm text-destructive">
                    {fieldError.message}
                  </p>
                ) : null}
              </div>
            );
          })}

          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
        </form>
      )}
    </section>
  );
}
