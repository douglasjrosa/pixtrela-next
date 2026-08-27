"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { FormModalShell } from "@/components/ui/form-modal-shell";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { calculateExpectedTimeFromAction } from "@/lib/actions/default-actions";
import type { SubTaskPreset } from "@/lib/business/subtask-preset";

const ACTION_UNITS_STEP = 0.01;
const ACTION_UNITS_FORM_ID = "action-units-form";

export interface ActionUnitsPromptModalProps {
  open: boolean;
  preset: SubTaskPreset | null;
  onClose: () => void;
  onConfirm: (expectedTime: number) => void;
}

export function ActionUnitsPromptModal({
  open,
  preset,
  onClose,
  onConfirm,
}: ActionUnitsPromptModalProps) {
  const tCommon = useTranslations("common");
  const tActions = useTranslations("factoryActions");
  const [units, setUnits] = useState(1);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (open) {
      setUnits(1);
      setInvalid(false);
    }
  }, [open, preset?.documentId]);

  if (!preset) return null;

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault();
    if (!preset || !Number.isFinite(units) || units <= 0) {
      setInvalid(true);
      return;
    }
    onConfirm(
      calculateExpectedTimeFromAction(preset.actionUnitTime, units),
    );
  }

  return (
    <FormModalShell
      open={open}
      title={tActions("actionUnitsTitle")}
      size="sm"
      fillBody={false}
      layer="nested"
      onClose={onClose}
      footerEnd={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            {tCommon("cancel")}
          </Button>
          <Button type="submit" form={ACTION_UNITS_FORM_ID}>
            {tActions("confirm")}
          </Button>
        </>
      }
    >
      <form id={ACTION_UNITS_FORM_ID} className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="action-units-input">{preset.actionQtyQuestion}</Label>
          <NumberInput
            id="action-units-input"
            min={ACTION_UNITS_STEP}
            step={ACTION_UNITS_STEP}
            value={units}
            onChange={(event) => {
              setUnits(Number(event.target.value));
              setInvalid(false);
            }}
          />
          {invalid ? (
            <p className="text-sm text-destructive">
              {tActions("actionUnitsInvalid")}
            </p>
          ) : null}
        </div>
      </form>
    </FormModalShell>
  );
}
