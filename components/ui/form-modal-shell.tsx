"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

/**
 * Min height for primary panels inside the scroll body (e.g. nested lists).
 * Keeps those panels tall enough that chrome above them can scroll away on
 * short viewports (landscape phones), giving lists more usable height.
 */
export const FORM_MODAL_PRIMARY_PANEL_MIN_HEIGHT_CLASS =
  "min-h-[calc(90dvh-3.5rem)]";

/** Scroll body fills remaining dialog height after the fixed header. */
export const FORM_MODAL_BODY_MIN_HEIGHT_CLASS = "min-h-[calc(90dvh-3.5rem)]";

/** Above AppNav (z-50) and mobile menu (z-[60]). */
export const FORM_MODAL_OVERLAY_Z_CLASS = "z-[70]";

export interface FormModalShellProps {
  open: boolean;
  title: ReactNode;
  titleId?: string;
  onClose: () => void;
  disabled?: boolean;
  size?: keyof typeof SIZE_CLASS;
  /** Full-viewport on small screens; constrained dialog from `sm` up. */
  layout?: "default" | "viewport";
  /**
   * When false, body grows with content instead of forcing near-viewport min-height.
   * Prefer for short forms (e.g. theme settings).
   */
  fillBody?: boolean;
  headerActions?: ReactNode;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  children: ReactNode;
}

export function FormModalShell({
  open,
  title,
  titleId: titleIdProp,
  onClose,
  disabled = false,
  size = "lg",
  layout = "default",
  fillBody = true,
  headerActions,
  footerStart,
  footerEnd,
  children,
}: FormModalShellProps) {
  const tCommon = useTranslations("common");
  const generatedTitleId = useId();
  const titleId = titleIdProp ?? generatedTitleId;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const showFooter = footerStart != null || footerEnd != null;
  const isViewport = layout === "viewport";

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !disabled) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, disabled]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-black/50",
        FORM_MODAL_OVERLAY_Z_CLASS,
        isViewport ? "p-0 sm:p-4" : "p-4 pt-[4.5rem]",
      )}
      role="presentation"
      onClick={disabled ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "flex w-full flex-col overflow-hidden bg-background shadow-lg",
          isViewport
            ? cn(
                "h-dvh max-w-none rounded-none border-0",
                "sm:h-auto sm:max-h-[min(85vh,calc(100dvh-5.5rem))] sm:rounded-lg sm:border",
                SIZE_CLASS[size],
              )
            : cn(
                "max-h-[min(85vh,calc(100dvh-5.5rem))] rounded-lg border",
                SIZE_CLASS[size],
              ),
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 border-b",
            "px-4 py-3",
          )}
        >
          <h2 id={titleId} className="min-w-0 text-lg font-semibold">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-1">
            {headerActions}
            <Button
              ref={closeButtonRef}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={tCommon("close")}
              disabled={disabled}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <div
          data-slot="form-modal-body"
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div
            className={cn(
              "flex flex-col p-4",
              fillBody && FORM_MODAL_BODY_MIN_HEIGHT_CLASS,
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
            {showFooter ? (
              <div
                className={cn(
                  "mt-4 flex flex-wrap items-center justify-between gap-3",
                  "border-t pt-4",
                )}
              >
                <div className="flex flex-wrap gap-2">
                  {footerStart ?? <span />}
                </div>
                <div className="flex flex-wrap gap-2">{footerEnd}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
