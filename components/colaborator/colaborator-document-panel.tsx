"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";

import { COLABORATOR_CONTENT_SURFACE_CLASS } from
  "@/components/colaborator/colaborator-content-surface";
import { COLABORATOR_STORE_SURFACE_DESKTOP_WIDTH_CLASS } from
  "@/lib/store/store-layout";
import { isColaboratorStoreLayoutPath } from "@/lib/store/store-path";
import { cn } from "@/lib/utils";

export interface ColaboratorDocumentPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ColaboratorDocumentPanel({
  children,
  className,
  style,
}: ColaboratorDocumentPanelProps) {
  const pathname = usePathname();
  const isStore = isColaboratorStoreLayoutPath(pathname);

  return (
    <div
      className={cn(
        COLABORATOR_CONTENT_SURFACE_CLASS,
        isStore && COLABORATOR_STORE_SURFACE_DESKTOP_WIDTH_CLASS,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
