import { ImageIcon } from "lucide-react";

import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";

export interface AwardListImageProps {
  label: string;
  imageUrl?: string | null;
}

/** Circular award thumbnail for list rows. */
export function AwardListImage({ label, imageUrl }: AwardListImageProps) {
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
        <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
      )}
    </span>
  );
}
