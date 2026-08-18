"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { BalanceAdjustmentResult } from "@/app/(app)/balance-adjustment-actions";
import {
  BalanceAdjustmentModal,
  type BalanceCurrencyOption,
} from "@/components/dashboard/balance-adjustment-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/auth/nav";
import { canAdjustColaboratorBalance } from "@/lib/auth/permissions";
import { NATIVE_SELECT_TALL_CLASS_NAME } from "@/lib/ui/native-select";
import type { ColaboratorOption } from "@/lib/dashboard/types";

export interface ColaboratorPickerProps {
  options: ColaboratorOption[];
  selectedDocumentId: string;
  role: Role;
  currencyOptions?: BalanceCurrencyOption[];
  onAdjustBalance?: (input: {
    colaboratorDocumentId: string;
    date: string;
    currencyId: string;
    amount: number;
  }) => Promise<BalanceAdjustmentResult>;
}

export function ColaboratorPicker({
  options,
  selectedDocumentId,
  role,
  currencyOptions = [],
  onAdjustBalance,
}: ColaboratorPickerProps) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const showBalanceAdjustment =
    canAdjustColaboratorBalance(role) &&
    Boolean(onAdjustBalance) &&
    currencyOptions.length > 0 &&
    Boolean(selectedDocumentId);

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    const value = event.target.value;
    if (!value) return;
    router.push(`/?colaborator=${encodeURIComponent(value)}`);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="dashboard-colaborator">{t("colaborator")}</Label>
          <select
            id="dashboard-colaborator"
            className={NATIVE_SELECT_TALL_CLASS_NAME + " max-w-md"}
            value={selectedDocumentId}
            onChange={handleChange}
          >
            {options.map((option) => (
              <option key={option.documentId} value={option.documentId}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        {showBalanceAdjustment ? (
          <Button
            type="button"
            variant="outline"
            className="mt-7 shrink-0"
            onClick={() => setAdjustmentOpen(true)}
          >
            {t("balanceAdjustmentButton")}
          </Button>
        ) : null}
      </div>

      {showBalanceAdjustment && onAdjustBalance ? (
        <BalanceAdjustmentModal
          open={adjustmentOpen}
          colaboratorDocumentId={selectedDocumentId}
          currencyOptions={currencyOptions}
          onClose={() => setAdjustmentOpen(false)}
          onSave={onAdjustBalance}
        />
      ) : null}
    </>
  );
}

export interface ColaboratorLabelProps {
  name: string;
}

export function ColaboratorLabel({ name }: ColaboratorLabelProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{t("colaborator")}</p>
      <p className="text-lg font-medium">{name}</p>
    </div>
  );
}
