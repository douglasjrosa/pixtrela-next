import { getTranslations } from "next-intl/server";

import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Label } from "@/components/ui/label";
import { primaryCurrencyDocumentId } from "@/lib/business/primary-currency";
import { NATIVE_SELECT_CLASS_NAME } from "@/lib/ui/native-select";

export interface ActiveCurrencyOption {
  documentId: string;
  title: string;
  pluralTitle: string;
}

export interface CurrencyFormProps {
  currencies: ActiveCurrencyOption[];
  activeCurrencyDocumentId: string;
  action: (formData: FormData) => void | Promise<void>;
}

function resolveCurrencyTitle(currency: ActiveCurrencyOption): string {
  if (currency.title.trim().length > 0) return currency.title;
  if (currency.pluralTitle.trim().length > 0) return currency.pluralTitle;
  return currency.documentId;
}

function selectedCurrencyId(
  currencies: readonly ActiveCurrencyOption[],
  activeCurrencyDocumentId: string,
): string {
  const assigned = currencies.find(
    (currency) => currency.documentId === activeCurrencyDocumentId,
  );
  if (assigned) return assigned.documentId;
  return primaryCurrencyDocumentId(currencies) ?? "";
}

/** Selects which currency credits Stars when sub-tasks finish. */
export async function CurrencyForm({
  currencies,
  activeCurrencyDocumentId,
  action,
}: CurrencyFormProps) {
  const tCommon = await getTranslations("common");
  const tSettings = await getTranslations("settings");
  const selectedId = selectedCurrencyId(currencies, activeCurrencyDocumentId);

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
        <p className="text-sm text-muted-foreground">
          {tSettings("noCurrencies")}
        </p>
      ) : (
        <form action={action} className="space-y-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="currency-active-for-subtasks" className="shrink-0">
              {tSettings("currencyActiveForSubtasks")}
            </Label>
            <select
              id="currency-active-for-subtasks"
              name="currencyDocumentId"
              defaultValue={selectedId}
              required
              className={`${NATIVE_SELECT_CLASS_NAME} flex-1`}
            >
              {currencies.map((currency) => (
                <option key={currency.documentId} value={currency.documentId}>
                  {resolveCurrencyTitle(currency)}
                </option>
              ))}
            </select>
          </div>

          <FormSubmitButton label={tCommon("save")} />
        </form>
      )}
    </section>
  );
}
