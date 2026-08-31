"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { showConfirmToast } from "@/lib/ui/app-toast";

export interface UnsavedLeaveGuardOptions {
  enabled: boolean;
  message: string;
  yesLabel: string;
  noLabel: string;
}

export function isModifiedNavigationClick(event: MouseEvent): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function getInternalNavigationPath(
  anchor: HTMLAnchorElement,
): string | null {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:")) {
    return null;
  }
  if (href.startsWith("tel:")) return null;

  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;

    const current = new URL(window.location.href);
    if (
      url.pathname === current.pathname &&
      url.search === current.search
    ) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function useUnsavedLeaveGuard({
  enabled,
  message,
  yesLabel,
  noLabel,
}: UnsavedLeaveGuardOptions): void {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;

    function confirmLeave(onProceed: () => void): void {
      showConfirmToast({
        message,
        yesLabel,
        noLabel,
        onYes: onProceed,
      });
    }

    function handleBeforeUnload(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleClick(event: MouseEvent): void {
      if (isModifiedNavigationClick(event)) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const destination = getInternalNavigationPath(anchor);
      if (!destination) return;

      event.preventDefault();
      event.stopPropagation();
      confirmLeave(() => router.push(destination));
    }

    function handlePopState(): void {
      window.history.pushState({ unsavedLeaveGuard: true }, "", pathname);
      confirmLeave(() => {
        window.removeEventListener("popstate", handlePopState);
        window.history.back();
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    window.history.pushState({ unsavedLeaveGuard: true }, "", pathname);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, message, noLabel, pathname, router, yesLabel]);
}
