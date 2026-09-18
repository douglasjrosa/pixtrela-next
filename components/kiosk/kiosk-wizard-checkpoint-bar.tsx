"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type WizardCheckpointState = "completed" | "current" | "upcoming";

export function resolveWizardCheckpointState(
  index: number,
  currentStepIndex: number,
): WizardCheckpointState {
  if (index < currentStepIndex) return "completed";
  if (index === currentStepIndex) return "current";
  return "upcoming";
}

export function isWizardConnectorComplete(
  connectorIndex: number,
  currentStepIndex: number,
): boolean {
  return connectorIndex < currentStepIndex;
}

export interface KioskWizardCheckpointBarProps {
  stepCount: number;
  currentStepIndex: number;
}

export function KioskWizardCheckpointBar({
  stepCount,
  currentStepIndex,
}: KioskWizardCheckpointBarProps) {
  const t = useTranslations("kiosk");

  if (stepCount <= 1) return null;

  const currentStep = currentStepIndex + 1;

  return (
    <div
      className="my-4 flex w-full items-center"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={stepCount}
      aria-valuenow={currentStep}
      aria-label={t("exitWizardStepProgress", {
        current: currentStep,
        total: stepCount,
      })}
    >
      {Array.from({ length: stepCount }, (_, index) => {
        const state = resolveWizardCheckpointState(index, currentStepIndex);

        return (
          <Fragment key={index}>
            {index > 0 ? (
              <div
                className={cn(
                  "h-1 min-w-0 flex-1 rounded-full",
                  isWizardConnectorComplete(index - 1, currentStepIndex)
                    ? "bg-success"
                    : "bg-border",
                )}
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                "shrink-0 rounded-full border-2 transition-colors",
                state === "completed" && "size-3 border-success bg-success",
                state === "current" &&
                  "size-3.5 border-success bg-success shadow-sm",
                state === "upcoming" &&
                  "size-3 border-muted-foreground/35 bg-background",
              )}
              aria-hidden
            />
          </Fragment>
        );
      })}
    </div>
  );
}
