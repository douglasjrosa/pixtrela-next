"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { BalanceAdjustmentResult } from "@/app/(app)/balance-adjustment-actions";
import {
  formatIsoDateLocal,
  getBalanceAdjustmentDateBounds,
  isBalanceAdjustmentDateInRange,
} from "@/lib/dashboard/balance-adjustment-date";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { NATIVE_SELECT_TALL_CLASS_NAME } from "@/lib/ui/native-select";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

export type BalanceCurrencyOption = {
  id: string;
  label: string;
};

export function resolveDefaultCurrencyId(
  options: BalanceCurrencyOption[],
  preferredId?: string | null,
): string {
  if (preferredId && options.some((option) => option.id === preferredId)) {
    return preferredId;
  }
  return options[0]?.id ?? "";
}

export interface BalanceAdjustmentModalProps {
  open: boolean;
  colaboratorDocumentId: string;
  currencyOptions: BalanceCurrencyOption[];
  defaultCurrencyId?: string | null;
  onClose: () => void;
  onSave: (input: {
    colaboratorDocumentId: string;
    date: string;
    currencyId: string;
    amount: number;
  }) => Promise<BalanceAdjustmentResult>;
}

function todayIsoDate(): string {
  return formatIsoDateLocal(new Date());
}

export function BalanceAdjustmentModal({
  open,
  colaboratorDocumentId,
  currencyOptions,
  defaultCurrencyId = null,
  onClose,
  onSave,
}: BalanceAdjustmentModalProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [date, setDate] = useState(todayIsoDate);
  const [currencyId, setCurrencyId] = useState(() =>
    resolveDefaultCurrencyId(currencyOptions, defaultCurrencyId),
  );
  const [amount, setAmount] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { min: minDate, max: maxDate } = getBalanceAdjustmentDateBounds();

  function resetForm(): void {
    setDate(todayIsoDate());
    setCurrencyId(resolveDefaultCurrencyId(currencyOptions, defaultCurrencyId));
    setAmount("");
    setFieldError(null);
  }

  useEffect(() => {
    if (!open) return;
    setDate(todayIsoDate());
    setCurrencyId(resolveDefaultCurrencyId(currencyOptions, defaultCurrencyId));
    setAmount("");
    setFieldError(null);
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open gate
  }, [open]);

  function handleClose(): void {
    if (isPending) return;
    resetForm();
    onClose();
  }

  function handleSubmit(): void {
    const parsedAmount = Number(amount);
    if (!isBalanceAdjustmentDateInRange(date)) {
      setFieldError(t("balanceAdjustmentDateInvalid"));
      return;
    }
    if (!currencyId) {
      setFieldError(t("balanceAdjustmentCurrencyRequired"));
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
      setFieldError(t("balanceAdjustmentAmountRequired"));
      return;
    }

    startTransition(async () => {
      setFieldError(null);
      const result = await onSave({
        colaboratorDocumentId,
        date,
        currencyId,
        amount: parsedAmount,
      });
      if (!result.ok) {
        const detail =
          result.error === "forbidden"
            ? t("balanceAdjustmentForbidden")
            : t("balanceAdjustmentSaveFailed");
        setFieldError(detail);
        showErrorToast(detail);
        return;
      }
      showSuccessToast(t("balanceAdjustmentSaved"));
      resetForm();
      onClose();
      router.refresh();
    });
  }

  return (
    <FormModalShell
      open={open}
      title={t("balanceAdjustmentTitle")}
      onClose={handleClose}
      size="sm"
      fillBody={false}
      disabled={isPending}
      footerStart={
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={handleClose}
        >
          {tCommon("cancel")}
        </Button>
      }
      footerEnd={
        <Button type="button" disabled={isPending} onClick={handleSubmit}>
          {tCommon("save")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 px-1">
        <div className="mx-auto w-full max-w-[14rem] space-y-1.5">
          <Label htmlFor="balance-adjustment-date">
            {t("balanceAdjustmentDate")}
          </Label>
          <Input
            id="balance-adjustment-date"
            type="date"
            className="w-full text-center"
            value={date}
            min={minDate}
            max={maxDate}
            disabled={isPending}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="mx-auto w-full max-w-[14rem] space-y-1.5">
          <Label
            htmlFor="balance-adjustment-currency"
            className="block text-center"
          >
            {t("balanceAdjustmentCurrency")}
          </Label>
          <select
            id="balance-adjustment-currency"
            className={cn(NATIVE_SELECT_TALL_CLASS_NAME, "w-full")}
            value={currencyId}
            disabled={isPending || currencyOptions.length === 0}
            onChange={(event) => setCurrencyId(event.target.value)}
          >
            {currencyOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mx-auto w-full max-w-[12rem] space-y-1.5">
          <Label htmlFor="balance-adjustment-amount">
            {t("balanceAdjustmentAmount")}
          </Label>
          <NumberInput
            id="balance-adjustment-amount"
            className="w-full"
            value={amount}
            step="any"
            disabled={isPending}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>

        {fieldError ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {fieldError}
          </p>
        ) : null}
      </div>
    </FormModalShell>
  );
}
