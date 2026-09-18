"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { APP_LOCALE } from "@/lib/i18n/locale";
import {
  PASSWORD_MASK_CHAR,
  appendPasswordChars,
  buildPasswordDisplay,
  createPasswordRevealState,
  deletePasswordRange,
  nextPasswordMaskTickMs,
  removeLastPasswordChar,
  replacePasswordRange,
  type PasswordRevealState,
} from "@/lib/ui/password-mask";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function prefersCoarsePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse)").matches;
}

function emitInputChange(
  onChange: React.ChangeEventHandler<HTMLInputElement> | undefined,
  target: HTMLInputElement,
  value: string,
): void {
  onChange?.({
    target: { ...target, value, name: target.name },
    currentTarget: { ...target, value, name: target.name },
  } as React.ChangeEvent<HTMLInputElement>);
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<"input">, "type" | "value">
>(function PasswordInput(
  {
    className,
    onChange,
    onBlur,
    name,
    id,
    disabled,
    autoComplete,
    defaultValue,
    ...props
  },
  ref,
) {
  const t = useTranslations("common");
  const hiddenRef = React.useRef<HTMLInputElement>(null);
  const visibleRef = React.useRef<HTMLInputElement>(null);
  const initialValue =
    typeof defaultValue === "string"
      ? defaultValue
      : typeof defaultValue === "number"
        ? String(defaultValue)
        : "";
  const [revealState, setRevealState] = React.useState<PasswordRevealState>(
    () => createPasswordRevealState(initialValue),
  );
  const revealStateRef = React.useRef(revealState);
  const selectionRef = React.useRef({ start: 0, end: 0 });
  const beforeInputHandledRef = React.useRef(false);
  const [showAll, setShowAll] = React.useState(false);
  const [useNativePasswordField] = React.useState(prefersCoarsePointer);
  const [, refreshMask] = React.useReducer((count) => count + 1, 0);

  revealStateRef.current = revealState;

  React.useImperativeHandle(ref, () => hiddenRef.current as HTMLInputElement);

  const displayValue = buildPasswordDisplay(revealState, showAll, Date.now());

  React.useEffect(() => {
    if (showAll || revealState.value.length === 0) {
      return;
    }

    const delay = nextPasswordMaskTickMs(revealState, Date.now());
    if (delay == null) {
      return;
    }

    const timer = window.setTimeout(() => refreshMask(), delay);
    return () => window.clearTimeout(timer);
  }, [revealState, showAll]);

  function readSelectionBounds(input: HTMLInputElement): { start: number; end: number } {
    const domStart = input.selectionStart;
    const domEnd = input.selectionEnd;

    if (domStart != null && domEnd != null) {
      selectionRef.current = { start: domStart, end: domEnd };
    }

    return selectionRef.current;
  }

  function handleSelect(event: React.SyntheticEvent<HTMLInputElement>): void {
    readSelectionBounds(event.currentTarget);
  }

  function syncValue(next: PasswordRevealState, cursorPos?: number): void {
    revealStateRef.current = next;
    setRevealState(next);
    const hidden = hiddenRef.current;
    if (!hidden) {
      return;
    }
    hidden.value = next.value;
    emitInputChange(onChange, hidden, next.value);
    if (cursorPos != null) {
      const safePos = Math.max(0, Math.min(cursorPos, next.value.length));
      selectionRef.current = { start: safePos, end: safePos };
      const visible = visibleRef.current;
      if (visible) {
        visible.setSelectionRange(safePos, safePos);
      }
      requestAnimationFrame(() => {
        visibleRef.current?.setSelectionRange(safePos, safePos);
      });
    }
  }

  function tryHandleMaskedValueChange(
    incoming: string,
    input: HTMLInputElement,
  ): boolean {
    if (showAll) {
      return false;
    }

    const now = Date.now();
    const current = revealStateRef.current;
    const display = buildPasswordDisplay(current, false, now);

    if (incoming === display) {
      return true;
    }

    if (isPlaintextPasswordFill(incoming)) {
      if (incoming !== current.value) {
        syncValue(
          createPasswordRevealState(incoming),
          input.selectionStart ?? incoming.length,
        );
      }
      return true;
    }

    // Mobile virtual keyboards often emit change/input with the masked display
    // plus the new plaintext character (e.g. "•2" after the first char masked).
    if (incoming.length > display.length && incoming.startsWith(display)) {
      const added = incoming.slice(display.length);
      if (isPlaintextPasswordFill(added)) {
        syncValue(appendPasswordChars(current, added, now), incoming.length);
        return true;
      }
    }

    return false;
  }

  function isPlaintextPasswordFill(incoming: string): boolean {
    if (incoming.length === 0) {
      return false;
    }
    return ![...incoming].some((char) => char === PASSWORD_MASK_CHAR);
  }

  function handleVisibleChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    const incoming = event.target.value;

    if (showAll) {
      const next = createPasswordRevealState(incoming);
      syncValue(next, event.target.selectionStart ?? next.value.length);
      return;
    }

    tryHandleMaskedValueChange(incoming, event.target);
  }

  function handleInput(event: React.FormEvent<HTMLInputElement>): void {
    if (showAll || disabled || beforeInputHandledRef.current) {
      return;
    }

    const input = event.currentTarget;
    if (tryHandleMaskedValueChange(input.value, input)) {
      return;
    }

    const nativeEvent = event.nativeEvent as InputEvent;
    if (
      nativeEvent.inputType === "insertText" &&
      nativeEvent.data &&
      isPlaintextPasswordFill(nativeEvent.data)
    ) {
      const end = input.selectionStart ?? nativeEvent.data.length;
      const start = Math.max(0, end - nativeEvent.data.length);
      selectionRef.current = { start, end };
      syncValue(
        replacePasswordRange(
          revealStateRef.current,
          start,
          end,
          nativeEvent.data,
          Date.now(),
        ),
        end,
      );
    }
  }

  function handleBeforeInput(
    event: React.FormEvent<HTMLInputElement>,
  ): void {
    if (showAll || disabled) {
      return;
    }

    const nativeEvent = event.nativeEvent as InputEvent;
    if (typeof nativeEvent.inputType !== "string") {
      return;
    }

    const input = event.currentTarget;
    const domStart = input.selectionStart;
    const domEnd = input.selectionEnd;
    const start = domStart ?? selectionRef.current.start;
    const end = domEnd ?? selectionRef.current.end;
    selectionRef.current = { start, end };
    const current = revealStateRef.current;
    const now = Date.now();

    if (nativeEvent.inputType === "insertText" && nativeEvent.data) {
      event.preventDefault();
      beforeInputHandledRef.current = true;
      syncValue(
        replacePasswordRange(current, start, end, nativeEvent.data, now),
        start + nativeEvent.data.length,
      );
      queueMicrotask(() => {
        beforeInputHandledRef.current = false;
      });
      return;
    }

    if (
      nativeEvent.inputType === "insertFromAutoFill" ||
      nativeEvent.inputType === "insertReplacementText"
    ) {
      const text = nativeEvent.data ?? "";
      if (!text) {
        return;
      }
      event.preventDefault();
      syncValue(createPasswordRevealState(text), text.length);
    }
  }

  function handleVisibleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void {
    if (showAll || disabled) {
      return;
    }

    if (beforeInputHandledRef.current) {
      if (
        event.key.length === 1 ||
        event.key === "Backspace" ||
        event.key === "Delete"
      ) {
        event.preventDefault();
      }
      return;
    }

    const current = revealStateRef.current;
    const { start, end } = selectionRef.current;
    const now = Date.now();

    if (event.key === "Backspace") {
      event.preventDefault();
      if (start !== end) {
        syncValue(deletePasswordRange(current, start, end), start);
        return;
      }
      if (start > 0) {
        const next =
          start === current.value.length
            ? removeLastPasswordChar(current, now)
            : deletePasswordRange(current, start - 1, start);
        syncValue(next, start - 1);
      }
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      if (start !== end) {
        syncValue(deletePasswordRange(current, start, end), start);
        return;
      }
      if (start < current.value.length) {
        syncValue(deletePasswordRange(current, start, start + 1), start);
      }
      return;
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      syncValue(
        replacePasswordRange(current, start, end, event.key, now),
        start + 1,
      );
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    if (disabled) {
      return;
    }

    const text = event.clipboardData.getData("text");
    if (!text) {
      return;
    }

    event.preventDefault();
    const input = event.currentTarget;
    const now = Date.now();

    const current = revealStateRef.current;

    if (showAll) {
      const { start, end } = readSelectionBounds(input);
      const nextValue =
        current.value.slice(0, start) +
        text +
        current.value.slice(end);
      syncValue(createPasswordRevealState(nextValue), start + text.length);
      return;
    }

    const { start, end } = readSelectionBounds(input);
    syncValue(
      replacePasswordRange(current, start, end, text, now),
      start + text.length,
    );
  }

  function toggleShowAll(): void {
    setShowAll((current) => !current);
    visibleRef.current?.focus();
  }

  function handleNativeChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void {
    const next = createPasswordRevealState(event.target.value);
    revealStateRef.current = next;
    setRevealState(next);
    const hidden = hiddenRef.current;
    if (hidden) {
      hidden.value = next.value;
    }
    emitInputChange(onChange, event.target, next.value);
  }

  if (useNativePasswordField) {
    return (
      <div className="relative">
        <input
          ref={hiddenRef}
          type="hidden"
          name={name}
          id={id ? `${id}-value` : undefined}
          value={revealState.value}
          tabIndex={-1}
          aria-hidden
          readOnly
        />
        <input
          {...props}
          ref={visibleRef}
          id={id}
          type={showAll ? "text" : "password"}
          lang={APP_LOCALE}
          autoComplete={autoComplete}
          disabled={disabled}
          value={revealState.value}
          onChange={handleNativeChange}
          onBlur={onBlur}
          className={cn(INPUT_CLASS, "pr-10", className)}
        />
        <button
          type="button"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1",
            "text-muted-foreground hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            disabled && "pointer-events-none opacity-50",
          )}
          onClick={toggleShowAll}
          aria-label={showAll ? t("hidePassword") : t("showPassword")}
          aria-pressed={showAll}
          disabled={disabled}
          tabIndex={-1}
        >
          {showAll ? (
            <EyeOff className="size-4" aria-hidden strokeWidth={1.75} />
          ) : (
            <Eye className="size-4" aria-hidden strokeWidth={1.75} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        id={id ? `${id}-value` : undefined}
        value={revealState.value}
        tabIndex={-1}
        aria-hidden
        readOnly
      />
      <input
        {...props}
        ref={visibleRef}
        id={id}
        type="text"
        lang={APP_LOCALE}
        autoComplete={autoComplete}
        disabled={disabled}
        value={displayValue}
        onChange={handleVisibleChange}
        onInput={handleInput}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleVisibleKeyDown}
        onPaste={handlePaste}
        onSelect={handleSelect}
        onBlur={onBlur}
        className={cn(INPUT_CLASS, "pr-10", className)}
      />
      <button
        type="button"
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1",
          "text-muted-foreground hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled && "pointer-events-none opacity-50",
        )}
        onClick={toggleShowAll}
        aria-label={showAll ? t("hidePassword") : t("showPassword")}
        aria-pressed={showAll}
        disabled={disabled}
        tabIndex={-1}
      >
        {showAll ? (
          <EyeOff className="size-4" aria-hidden strokeWidth={1.75} />
        ) : (
          <Eye className="size-4" aria-hidden strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
