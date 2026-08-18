"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  md: "max-w-lg",
  lgNarrow: "max-w-xl",
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

/** Above a base form modal (create/edit stacked on another form). */
export const FORM_MODAL_NESTED_OVERLAY_Z_CLASS = "z-[80]";

/** Confirm and picker dialogs above any form overlay. */
export const FORM_MODAL_DIALOG_OVERLAY_Z_CLASS = "z-[90]";

export interface FormModalShellProps {
  open: boolean;
  title: ReactNode;
  titleId?: string;
  onClose: () => void;
  disabled?: boolean;
  size?: keyof typeof SIZE_CLASS;
  /** Full-viewport on small screens; constrained dialog from `sm` up. */
  layout?: "default" | "viewport";
  /** Use `nested` when this shell opens on top of another form modal. */
  layer?: "base" | "nested";
  /**
   * When false, body grows with content instead of forcing near-viewport min-height.
   * Prefer for short forms (e.g. theme settings).
   */
  fillBody?: boolean;
  /**
   * When false, the body does not scroll; children must manage their own overflow.
   */
  bodyScroll?: boolean;
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
  layer = "base",
  fillBody = true,
  bodyScroll = true,
  headerActions,
  footerStart,
  footerEnd,
  children,
}: FormModalShellProps) {
  const tCommon = useTranslations("common");
  const generatedTitleId = useId();
  const titleId = titleIdProp ?? generatedTitleId;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const disabledRef = useRef(disabled);
  onCloseRef.current = onClose;
  disabledRef.current = disabled;
  const showFooter = footerStart != null || footerEnd != null;
  const isViewport = layout === "viewport";
  const overlayZ =
    layer === "nested"
      ? FORM_MODAL_NESTED_OVERLAY_Z_CLASS
      : FORM_MODAL_OVERLAY_Z_CLASS;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !disabledRef.current) {
        onCloseRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 flex bg-overlay/50",
        overlayZ,
        isViewport
          ? "items-start justify-center p-0 sm:px-4 sm:pb-4 sm:pt-[4.5rem]"
          : "items-center justify-center p-4 pt-[4.5rem]",
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
                bodyScroll
                  ? "sm:h-auto sm:max-h-[min(85vh,calc(100dvh-5.5rem))] sm:rounded-lg sm:border"
                  : "sm:h-[min(85vh,calc(100dvh-5.5rem))] sm:max-h-[min(85vh,calc(100dvh-5.5rem))] sm:rounded-lg sm:border",
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
          className={cn(
            "min-h-0 flex-1",
            bodyScroll ? "overflow-y-auto" : "overflow-hidden",
          )}
        >
          <div
            className={cn(
              "flex flex-col p-4",
              bodyScroll && fillBody && FORM_MODAL_BODY_MIN_HEIGHT_CLASS,
              !bodyScroll && "h-full min-h-0",
            )}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
          </div>
        </div>
        {showFooter ? (
          <div
            data-slot="form-modal-footer"
            className={cn(
              "flex shrink-0 flex-wrap items-center justify-between gap-3",
              "border-t bg-background px-4 py-3",
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
  );
}
