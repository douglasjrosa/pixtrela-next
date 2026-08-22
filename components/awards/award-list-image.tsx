import { ImageIcon } from "lucide-react";

import { ListCircleThumb } from "@/components/ui/list-circle-thumb";

export interface AwardListImageProps {
  label: string;
  imageUrl?: string | null;
}

/** Circular award thumbnail for list rows. */
export function AwardListImage({ label, imageUrl }: AwardListImageProps) {
  return (
    <ListCircleThumb
      label={label}
      imageUrl={imageUrl}
      fallback={
        <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
      }
    />
  );
}
