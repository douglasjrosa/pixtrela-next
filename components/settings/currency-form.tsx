"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { rethrowIfNavigationError } from "@/lib/navigation/rethrow";
import { currencyForSubtasksSchema } from "@/lib/schemas/currency-for-subtasks";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

const SELECT_CLASS_NAME =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

type ActiveCurrencyFormInput = z.infer<typeof currencyForSubtasksSchema>;

export interface ActiveCurrencyOption {
  documentId: string;
  title: string;
  pluralTitle: string;
}

export interface CurrencyFormProps {
  currencies: ActiveCurrencyOption[];
  activeCurrencyDocumentId: string;
  onSave: (values: ActiveCurrencyFormInput) => void | Promise<void>;
}

function resolveCurrencyTitle(currency: ActiveCurrencyOption): string {
  if (currency.title.trim().length > 0) return currency.title;
  if (currency.pluralTitle.trim().length > 0) return currency.pluralTitle;
  return currency.documentId;
}

/** Selects which currency credits Stars when sub-tasks finish. */
export function CurrencyForm({
  currencies,
  activeCurrencyDocumentId,
  onSave,
}: CurrencyFormProps) {
  const tCommon = useTranslations("common");
  const tSettings = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit } = useForm<ActiveCurrencyFormInput>({
    resolver: zodResolver(currencyForSubtasksSchema),
    defaultValues: {
      currencyDocumentId: activeCurrencyDocumentId,
    },
  });

  function onSubmit(values: ActiveCurrencyFormInput): void {
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
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {tSettings("currencyActiveHeading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {tSettings("currencyActiveDescription")}
        </p>
      </div>

      {currencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tSettings("noCurrencies")}</p>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="currency-active-for-subtasks" className="shrink-0">
              {tSettings("currencyActiveForSubtasks")}
            </Label>
            <select
              id="currency-active-for-subtasks"
              className={`${SELECT_CLASS_NAME} flex-1`}
              {...register("currencyDocumentId")}
            >
              <option value="">{tSettings("currencyActiveNone")}</option>
              {currencies.map((currency) => (
                <option key={currency.documentId} value={currency.documentId}>
                  {resolveCurrencyTitle(currency)}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={isPending}>
            {tCommon("save")}
          </Button>
        </form>
      )}
    </section>
  );
}
