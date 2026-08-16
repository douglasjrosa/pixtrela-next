"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import {
  formatIsoDateToPtBrInput,
  parsePtBrInputToIsoDate,
} from "@/lib/format/datetime";

export interface DatePtBrInputProps {
  id: string;
  value: string;
  disabled?: boolean;
  allowEmpty?: boolean;
  onChange: (iso: string) => void;
}

export function DatePtBrInput({
  id,
  value,
  disabled = false,
  allowEmpty = false,
  onChange,
}: DatePtBrInputProps) {
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

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      disabled={disabled}
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={() => commit(text)}
    />
  );
}
