"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import {
  resolveNavLayoutMode,
  type NavLayoutMode,
} from "@/lib/auth/nav-layout";

export function useMeasuredNavLayout(measureKey: string): {
  slotRef: RefObject<HTMLDivElement | null>;
  measureRef: RefObject<HTMLUListElement | null>;
  layoutMode: NavLayoutMode;
} {
  const [layoutMode, setLayoutMode] = useState<NavLayoutMode>("desktop");
  const slotRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLUListElement>(null);

  const updateLayoutMode = useCallback((): void => {
    const slot = slotRef.current;
    const measure = measureRef.current;
    if (!slot || !measure) return;

    setLayoutMode(
      resolveNavLayoutMode({
        viewportWidth: window.innerWidth,
        availableWidth: slot.clientWidth,
        requiredWidth: measure.scrollWidth,
      }),
    );
  }, []);

  useLayoutEffect(() => {
    updateLayoutMode();
  }, [updateLayoutMode, measureKey]);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    window.addEventListener("resize", updateLayoutMode);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.removeEventListener("resize", updateLayoutMode);
      };
    }

    const observer = new ResizeObserver(() => {
      updateLayoutMode();
    });
    observer.observe(slot);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateLayoutMode);
    };
  }, [updateLayoutMode, measureKey]);

  return { slotRef, measureRef, layoutMode };
}
