"use client";

import type { MouseEvent, TouchEvent } from "react";
import { Lock, LockOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import {
  type KioskIdlePhase,
  useKioskIdleContext,
} from "./kiosk-idle-provider";

const INDICATOR_SIZE_PX = 56;
const STROKE_WIDTH = 3;
const RADIUS = (INDICATOR_SIZE_PX - STROKE_WIDTH) / 2;
const CENTER = INDICATOR_SIZE_PX / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LOCKED_ICON_CLASS = "text-muted-foreground";
const LOCKED_STROKE_CLASS = "stroke-muted-foreground";
const SHELL_CLASS =
  "relative flex items-center justify-center rounded-full bg-transparent";

function resolveIndicatorStyle(phase: KioskIdlePhase): {
  Icon: typeof LockOpen;
  iconClass: string;
  strokeClass: string;
  ariaKey: "idleLockOpen" | "idleLockClosed" | "idleLockHome";
  animateGauge: boolean;
  displayProgress: number;
  isInteractive: boolean;
} {
  if (phase === "home") {
    return {
      Icon: Lock,
      iconClass: LOCKED_ICON_CLASS,
      strokeClass: LOCKED_STROKE_CLASS,
      ariaKey: "idleLockHome",
      animateGauge: false,
      displayProgress: 1,
      isInteractive: false,
    };
  }

  if (phase === "expiring") {
    return {
      Icon: Lock,
      iconClass: LOCKED_ICON_CLASS,
      strokeClass: LOCKED_STROKE_CLASS,
      ariaKey: "idleLockClosed",
      animateGauge: false,
      displayProgress: 1,
      isInteractive: false,
    };
  }

  return {
    Icon: LockOpen,
    iconClass: "text-success",
    strokeClass: "stroke-success",
    ariaKey: "idleLockOpen",
    animateGauge: true,
    displayProgress: 0,
    isInteractive: true,
  };
}

export function KioskIdleLockIndicator() {
  const t = useTranslations("kiosk");
  const { progress, phase, lockSession } = useKioskIdleContext();
  const style = resolveIndicatorStyle(phase);
  const displayProgress =
    phase === "active" ? progress : style.displayProgress;
  const dashOffset = CIRCUMFERENCE * (1 - displayProgress);
  const Icon = style.Icon;

  function stopActivityPropagation(event: MouseEvent | TouchEvent): void {
    event.stopPropagation();
  }

  function handleLockClick(): void {
    lockSession();
  }

  const content = (
    <>
      <svg
        className="absolute inset-0"
        width={INDICATOR_SIZE_PX}
        height={INDICATOR_SIZE_PX}
        aria-hidden
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          className={
            phase === "active" ? "stroke-muted" : LOCKED_STROKE_CLASS
          }
          strokeWidth={STROKE_WIDTH}
          opacity={phase === "active" ? 1 : 0.35}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          className={cn(
            style.strokeClass,
            style.animateGauge && "transition-[stroke-dashoffset] duration-75",
          )}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      </svg>
      <Icon className="relative size-5" aria-hidden />
    </>
  );

  return (
    <div className="fixed right-4 bottom-4 z-50" aria-live="polite">
      {style.isInteractive ? (
        <button
          type="button"
          className={cn(
            SHELL_CLASS,
            "cursor-pointer hover:opacity-80 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-success/50",
            style.iconClass,
          )}
          style={{ width: INDICATOR_SIZE_PX, height: INDICATOR_SIZE_PX }}
          aria-label={t("idleLockButton")}
          onMouseDown={stopActivityPropagation}
          onTouchStart={stopActivityPropagation}
          onClick={handleLockClick}
        >
          {content}
        </button>
      ) : (
        <div
          className={cn(SHELL_CLASS, style.iconClass)}
          style={{ width: INDICATOR_SIZE_PX, height: INDICATOR_SIZE_PX }}
          aria-label={t(style.ariaKey)}
          role="img"
        >
          {content}
        </div>
      )}
    </div>
  );
}
