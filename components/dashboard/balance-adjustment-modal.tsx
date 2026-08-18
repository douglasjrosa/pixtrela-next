"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { BalanceAdjustmentResult } from "@/app/(app)/balance-adjustment-actions";
import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { NATIVE_SELECT_TALL_CLASS_NAME } from "@/lib/ui/native-select";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export type BalanceCurrencyOption = {
  id: string;
  label: string;
};

export interface BalanceAdjustmentModalProps {
  open: boolean;
  colaboratorDocumentId: string;
  currencyOptions: BalanceCurrencyOption[];
  onClose: () => void;
  onSave: (input: {
    colaboratorDocumentId: string;
    date: string;
    currencyId: string;
    amount: number;
  }) => Promise<BalanceAdjustmentResult>;
}

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BalanceAdjustmentModal({
  open,
  colaboratorDocumentId,
  currencyOptions,
  onClose,
  onSave,
}: BalanceAdjustmentModalProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [date, setDate] = useState(todayIsoDate);
  const [currencyId, setCurrencyId] = useState(currencyOptions[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm(): void {
    setDate(todayIsoDate());
    setCurrencyId(currencyOptions[0]?.id ?? "");
    setAmount("");
    setFieldError(null);
  }

  function handleClose(): void {
    if (isPending) return;
    resetForm();
    onClose();
  }

  function handleSubmit(): void {
    const parsedAmount = Number(amount);
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
      size="md"
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
      <div className="space-y-4 p-1">
        <div className="space-y-1.5">
          <Label htmlFor="balance-adjustment-date">{t("balanceAdjustmentDate")}</Label>
          <Input
            id="balance-adjustment-date"
            type="date"
            value={date}
            disabled={isPending}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="balance-adjustment-currency">
            {t("balanceAdjustmentCurrency")}
          </Label>
          <select
            id="balance-adjustment-currency"
            className={NATIVE_SELECT_TALL_CLASS_NAME}
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

        <div className="space-y-1.5">
          <Label htmlFor="balance-adjustment-amount">
            {t("balanceAdjustmentAmount")}
          </Label>
          <NumberInput
            id="balance-adjustment-amount"
            value={amount}
            step="any"
            disabled={isPending}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>

        {fieldError ? (
          <p role="alert" className="text-sm text-destructive">
            {fieldError}
          </p>
        ) : null}
      </div>
    </FormModalShell>
  );
}
