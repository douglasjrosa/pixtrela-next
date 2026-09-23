"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { msUntilNextAutoAdvance } from "@/lib/business/subtask-chain-allocation";
import type { KioskSubTask } from "@/lib/business/subtask-queue";

const ADVANCE_CATCH_UP_RETRY_MS = 2_000;

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
  const remainingOrdered = useMemo(
    () =>
      members.map((item) => ({
        documentId: item.documentId,
        expectedTime: item.expectedTime,
      })),
    [members],
  );
  const activeMemberId =
    members.find((item) => item.startedAt)?.documentId ?? null;

  const onAdvanceRef = useRef(onAdvance);
  const remainingOrderedRef = useRef(remainingOrdered);

  useLayoutEffect(() => {
    onAdvanceRef.current = onAdvance;
    remainingOrderedRef.current = remainingOrdered;
  }, [onAdvance, remainingOrdered]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    function delayUntilNext(): number | null {
      return msUntilNextAutoAdvance({
        runStartedAt: new Date(runStartedAt),
        now: new Date(),
        remainingOrdered: remainingOrderedRef.current,
      });
    }

    function arm(delay: number): void {
      const wait = delay === 0 ? ADVANCE_CATCH_UP_RETRY_MS : delay;
      timeoutId = window.setTimeout(() => {
        void (async () => {
          if (cancelled) return;
          await onAdvanceRef.current(chainRunId);
          if (cancelled) return;
          const next = delayUntilNext();
          if (next === null) return;
          arm(next);
        })();
      }, wait);
    }

    const delay = delayUntilNext();
    if (delay === null) return;
    if (delay === 0) {
      void onAdvanceRef.current(chainRunId);
    }
    arm(delay);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [activeMemberId, chainRunId, runStartedAt]);

  return null;
}
