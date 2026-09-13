"use client";

import { useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  formatIsoDateToPtBrInput,
  parsePtBrInputToIsoDate,
} from "@/lib/format/datetime";
import { cn } from "@/lib/utils";

export interface DatePtBrInputProps {
  id: string;
  value: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  min?: string;
  max?: string;
  className?: string;
  onChange: (iso: string) => void;
}

function openNativeDatePicker(input: HTMLInputElement | null): void {
  if (!input) return;
  try {
    input.showPicker();
  } catch {
    input.focus();
    input.click();
  }
}

export function DatePtBrInput({
  id,
  value,
  disabled = false,
  allowEmpty = false,
  min,
  max,
  className,
  onChange,
}: DatePtBrInputProps) {
  const t = useTranslations("common");
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(formatIsoDateToPtBrInput(value));
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(formatIsoDateToPtBrInput(value));
  }

  function commit(nextText: string): void {
    if (allowEmpty && !nextText.trim()) {
      onChange("");
      setText("");
      return;
    }
    const iso = parsePtBrInputToIsoDate(nextText);
    if (iso) {
      onChange(iso);
      setText(formatIsoDateToPtBrInput(iso));
      return;
    }
    setText(formatIsoDateToPtBrInput(value));
  }

  const pickerId = `${id}-native-picker`;

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        disabled={disabled}
        value={text}
        className="pr-9"
        onChange={(event) => setText(event.target.value)}
        onBlur={() => commit(text)}
      />
      <input
        ref={pickerRef}
        id={pickerId}
        type="date"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        min={min}
        max={max}
        value={value || ""}
        className="sr-only"
        onChange={(event) => {
          const next = event.target.value;
          if (!next && allowEmpty) {
            onChange("");
            setText("");
            return;
          }
          if (!next) return;
          onChange(next);
          setText(formatIsoDateToPtBrInput(next));
        }}
      />
      <button
        type="button"
        disabled={disabled}
        aria-label={t("openCalendar")}
        className={cn(
          "absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2",
          "items-center justify-center rounded-md text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
        onClick={() => openNativeDatePicker(pickerRef.current)}
      >
        <Calendar className="size-4" aria-hidden />
      </button>
    </div>
  );
}
