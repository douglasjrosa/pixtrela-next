"use client";

import type { ReactNode } from "react";

import { KioskIdleLockIndicator } from "./kiosk-idle-lock-indicator";
import { KioskIdleProvider } from "./kiosk-idle-provider";

export function KioskLayoutClient({
  children,
  sessionIdleMs,
}: {
  children: ReactNode;
  sessionIdleMs: number;
}) {
  return (
    <KioskIdleProvider sessionIdleMs={sessionIdleMs}>
      {children}
      <KioskIdleLockIndicator />
    </KioskIdleProvider>
  );
}
