"use client";

import { useTranslations } from "next-intl";

import type { KioskSubTask } from "@/lib/business/subtask-queue";
import type { ChainExitFieldConstraints } from "@/lib/business/chain-exit-inference";
import {
  isChainMemberAnswerComplete,
  type ChainStopAnswer,
} from "@/lib/business/subtask-chain-allocation";
import { getRemainingSubTaskQty } from "@/lib/business/subtask-queue";

import { KioskActionButton } from "./kiosk-action-button";
import { KioskChainMemberFields } from "./kiosk-chain-member-fields";
import { KioskExitModalShell } from "./kiosk-exit-modal-shell";

export interface KioskChainExitWizardModalProps {
  open: boolean;
  members: KioskSubTask[];
  stepIndex: number;
  answers: Record<string, ChainStopAnswer>;
  fieldConstraints?: Record<string, ChainExitFieldConstraints>;
  disabled?: boolean;
  busy?: boolean;
  onStepChange: (nextIndex: number) => void;
  onAnswerChange: (documentId: string, answer: ChainStopAnswer) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRefreshFlags?: (
    subTaskId: string,
  ) => Promise<{
    flags: Array<{ id: string; code: string }>;
    categoryId: string | null;
    requiresMaterialFlagsOnFinish?: boolean;
  }>;
}

export function KioskChainExitWizardModal({
  open,
  members,
  stepIndex,
  answers,
  fieldConstraints = {},
  disabled = false,
  busy = false,
  onStepChange,
  onAnswerChange,
  onConfirm,
  onCancel,
  onRefreshFlags,
}: KioskChainExitWizardModalProps) {
  const t = useTranslations("kiosk");
  const tCommon = useTranslations("common");
  const member = members[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === members.length - 1;
  const actionsDisabled = disabled || busy;

  if (!member) return null;

  const currentAnswer = answers[member.documentId];
  const stepComplete = isChainMemberAnswerComplete(
    member.sharingType,
    currentAnswer,
    {
      requiresMaterialFlagsOnFinish: member.requiresMaterialFlagsOnFinish,
      categoryId: member.subTaskCategoryId,
      availableFlagCount:
        currentAnswer?.availableFlagCount ?? member.availableFlags?.length ?? 0,
      semBandeiraSelected: currentAnswer?.semBandeira,
      targetQty: member.targetQty,
      completedQty: member.completedQty,
    },
  );

  const constraints = fieldConstraints[member.documentId];
  const remainingQty =
    member.sharingType === "qty"
      ? getRemainingSubTaskQty(member.targetQty, member.completedQty)
      : undefined;

  const footerButtonClass = "min-w-0 flex-1";

  return (
    <KioskExitModalShell
      open={open}
      title={member.name}
      onClose={onCancel}
      disabled={actionsDisabled}
      footerEnd={
        <div className="flex w-full flex-row items-stretch gap-2">
          {!isFirst ? (
            <KioskActionButton
              actionVariant="outline"
              className={footerButtonClass}
              disabled={actionsDisabled}
              onClick={() => onStepChange(stepIndex - 1)}
            >
              {tCommon("back")}
            </KioskActionButton>
          ) : (
            <KioskActionButton
              actionVariant="outline"
              className={footerButtonClass}
              disabled={actionsDisabled}
              onClick={onCancel}
            >
              {t("exitCancel")}
            </KioskActionButton>
          )}
          {isLast ? (
            <KioskActionButton
              actionVariant="produce"
              className={footerButtonClass}
              disabled={actionsDisabled || !stepComplete}
              onClick={onConfirm}
            >
              {busy ? t("actionLoading") : t("exitConfirm")}
            </KioskActionButton>
          ) : (
            <KioskActionButton
              actionVariant="produce"
              className={footerButtonClass}
              disabled={actionsDisabled || !stepComplete}
              onClick={() => onStepChange(stepIndex + 1)}
            >
              {t("continue")}
            </KioskActionButton>
          )}
        </div>
      }
    >
      <KioskChainMemberFields
        documentId={member.documentId}
        name={member.name}
        sharingType={member.sharingType}
        variant="modal"
        showName={false}
        wizardStepCount={members.length}
        wizardStepIndex={stepIndex}
        minQty={constraints?.min}
        maxQty={
          member.sharingType === "qty"
            ? constraints?.max ?? remainingQty
            : undefined
        }
        defaultQty={constraints?.defaultQty}
        availableFlags={member.availableFlags}
        subTaskCategoryId={member.subTaskCategoryId}
        requiresMaterialFlagsOnFinish={member.requiresMaterialFlagsOnFinish}
        value={currentAnswer}
        disabled={actionsDisabled}
        onRefreshFlags={
          onRefreshFlags ? () => onRefreshFlags(member.documentId) : undefined
        }
        onChange={(answer) => onAnswerChange(member.documentId, answer)}
      />
    </KioskExitModalShell>
  );
}
