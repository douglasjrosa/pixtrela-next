import type { ReactNode } from "react";

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
        "flex size-9 shrink-0 items-center justify-center overflow-hidden " +
        "rounded-full border bg-muted"
      }
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          className="size-full rounded-full object-cover"
        />
      ) : (
        fallback
      )}
    </span>
  );
}
