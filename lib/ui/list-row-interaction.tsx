"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent } from "react";

export type ListRowInteractionProps = {
  interactive: boolean;
  activate: ((event: MouseEvent<HTMLElement>) => void) | undefined;
  onKeyDown: ((event: KeyboardEvent<HTMLElement>) => void) | undefined;
  tabIndex: 0 | undefined;
  role: "link" | "button" | undefined;
  "aria-label": string | undefined;
  "data-href"?: string;
};

function keyboardActivate(onActivate: () => void) {
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };
}

function isIgnoredRowClick(event: MouseEvent<HTMLElement>): boolean {
  return Boolean((event.target as HTMLElement).closest("[data-row-select]"));
}

export function useListRowNavigateInteraction(
  href: string,
  label: string,
  options?: { ignoreSelectColumn?: boolean },
): ListRowInteractionProps {
  const router = useRouter();

  const navigate = () => router.push(href);

  const activate = (event: MouseEvent<HTMLElement>) => {
    if (options?.ignoreSelectColumn && isIgnoredRowClick(event)) {
      return;
    }
    navigate();
  };

  return {
    interactive: true,
    activate,
    onKeyDown: keyboardActivate(navigate),
    tabIndex: 0,
    role: "link",
    "aria-label": label,
    "data-href": href,
  };
}

export function useListRowActivateInteraction(
  label: string,
  onActivate: () => void,
  enabled = true,
): ListRowInteractionProps {
  if (!enabled) {
    return {
      interactive: false,
      activate: undefined,
      onKeyDown: undefined,
      tabIndex: undefined,
      role: undefined,
      "aria-label": undefined,
    };
  }

  return {
    interactive: true,
    activate: () => onActivate(),
    onKeyDown: keyboardActivate(onActivate),
    tabIndex: 0,
    role: "button",
    "aria-label": label,
  };
}
