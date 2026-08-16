"use client";

import { useEffect, useRef } from "react";

import { msUntilNextAutoAdvance } from "@/lib/business/subtask-chain-allocation";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

export interface KioskChainAdvanceTimerProps {
  chainRunId: string;
  runStartedAt: string;
  members: readonly KioskSubTask[];
  onAdvance: (chainRunId: string) => void | Promise<void>;
}

export function KioskChainAdvanceTimer({
  chainRunId,
  runStartedAt,
  members,
  onAdvance,
}: KioskChainAdvanceTimerProps) {
  const membersRef = useRef(members);
  membersRef.current = members;
  const remainingKey = members
    .map((item) => `${item.documentId}:${item.expectedTime}`)
    .join("|");

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    const remainingOrdered = membersRef.current.map((item) => ({
      documentId: item.documentId,
      expectedTime: item.expectedTime,
    }));

    function schedule(): void {
      const delay = msUntilNextAutoAdvance({
        runStartedAt: new Date(runStartedAt),
        now: new Date(),
        remainingOrdered,
      });
      if (delay === null) return;
      timeoutId = window.setTimeout(() => {
        if (cancelled) return;
        void onAdvance(chainRunId);
      }, delay);
    }

    void onAdvance(chainRunId);
    schedule();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [chainRunId, onAdvance, remainingKey, runStartedAt]);

  return null;
}
