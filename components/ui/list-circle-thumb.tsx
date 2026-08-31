import type { ReactNode } from "react";

import { AppImage } from "@/components/media/app-image";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export interface ListCircleThumbProps {
  label: string;
  imageUrl?: string | null;
  fallback: ReactNode;
}

/** Circular thumbnail used by list rows (awards, users, currencies). */
export function ListCircleThumb({
  label,
  imageUrl,
  fallback,
}: ListCircleThumbProps) {
  const url = toBrowserMediaUrl(imageUrl ?? null);

  return (
    <span
      className={
        "relative flex size-9 shrink-0 items-center justify-center overflow-hidden " +
        "rounded-full border bg-muted"
      }
    >
      {url ? (
        <AppImage
          src={url}
          alt={label}
          fill
          className="rounded-full object-cover"
        />
      ) : (
        fallback
      )}
    </span>
  );
}
