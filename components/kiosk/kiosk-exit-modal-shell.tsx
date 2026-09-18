"use client";

import type { ReactNode } from "react";

import { FormModalShell } from "@/components/ui/form-modal-shell";

export interface KioskExitModalShellProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  disabled?: boolean;
  footerStart?: ReactNode;
  footerEnd?: ReactNode;
  children: ReactNode;
}

export function KioskExitModalShell({
  open,
  title,
  onClose,
  disabled = false,
  footerStart,
  footerEnd,
  children,
}: KioskExitModalShellProps) {
  return (
    <FormModalShell
      open={open}
      title={title}
      onClose={onClose}
      disabled={disabled}
      layout="floating"
      size="md"
      fillBody={false}
      bodyScroll={false}
      bodyClassName="flex h-full min-h-0 flex-col"
      headerClassName="py-5"
      titleClassName="text-xl font-bold"
      footerStart={footerStart}
      footerEnd={footerEnd}
    >
      {children}
    </FormModalShell>
  );
}
