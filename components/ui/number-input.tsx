"use client";

import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  decimalPlacesFromStep,
  formatSteppedNumber,
  roundDecimal,
} from "@/lib/format/decimal";
import { cn } from "@/lib/utils";

const HIDE_NATIVE_SPIN_CLASS = cn(
  "[appearance:textfield]",
  "[&::-webkit-inner-spin-button]:appearance-none",
  "[&::-webkit-outer-spin-button]:appearance-none",
);

function parseStep(step: number | string | undefined): number {
  const parsed = Number(step);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseBound(value: number | string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function clampValue(
  value: number,
  min: number | undefined,
  max: number | undefined,
): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

function readInputNumber(
  input: HTMLInputElement,
  fallback: number,
): number {
  const parsed = Number(input.value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function setNativeInputValue(input: HTMLInputElement, nextValue: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  );
  descriptor?.set?.call(input, nextValue);
}

export type NumberInputProps = Omit<React.ComponentProps<"input">, "type">;

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      min,
      max,
      step,
      disabled,
      onChange,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const tCommon = useTranslations("common");
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const assignRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const minValue = parseBound(min);
    const maxValue = parseBound(max);
    const stepValue = parseStep(step);
    const fallbackValue = minValue ?? 0;

    function notifyChange(input: HTMLInputElement): void {
      onChange?.({
        target: input,
        currentTarget: input,
      } as React.ChangeEvent<HTMLInputElement>);
    }

    function writeRoundedValue(input: HTMLInputElement, value: number): void {
      const places = decimalPlacesFromStep(step);
      const next = clampValue(roundDecimal(value, places), minValue, maxValue);
      const formatted = formatSteppedNumber(next, places);
      if (input.value === formatted) return;
      setNativeInputValue(input, formatted);
      notifyChange(input);
    }

    function applyDelta(direction: 1 | -1): void {
      const input = inputRef.current;
      if (!input || disabled) return;

      const current = readInputNumber(input, fallbackValue);
      writeRoundedValue(input, current + direction * stepValue);
    }

    return (
      <div className={cn("relative flex w-full min-w-0", className)}>
        <input
          type="number"
          ref={assignRef}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            "h-9 w-full min-w-0 rounded-md border border-input bg-transparent",
            "py-1 pl-3 pr-8 text-center text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            HIDE_NATIVE_SPIN_CLASS,
          )}
          onChange={onChange}
          onBlur={(event) => {
            const input = event.currentTarget;
            writeRoundedValue(input, readInputNumber(input, fallbackValue));
            onBlur?.(event);
          }}
          {...props}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex w-7 flex-col",
            "overflow-hidden rounded-r-md border-l border-input",
          )}
        >
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={tCommon("increaseValue")}
            className={cn(
              "flex flex-1 items-center justify-center text-muted-foreground",
              "transition-colors hover:bg-muted hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
            onClick={() => applyDelta(1)}
          >
            <ChevronUp className="size-3.5 shrink-0" aria-hidden />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={tCommon("decreaseValue")}
            className={cn(
              "flex flex-1 items-center justify-center border-t border-input",
              "text-muted-foreground transition-colors hover:bg-muted",
              "hover:text-foreground disabled:pointer-events-none",
              "disabled:opacity-50",
            )}
            onClick={() => applyDelta(-1)}
          >
            <ChevronDown className="size-3.5 shrink-0" aria-hidden />
          </button>
        </div>
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
