import { Currency } from "lucide-react";

import { AppImage } from "@/components/media/app-image";
import { cn } from "@/lib/utils";

export interface CurrencyMediaIconProps {
  url: string | null | undefined;
  className?: string;
}

/** Renders Currency.iconMedia when present; Lucide Currency as fallback. */
export function CurrencyMediaIcon({ url, className }: CurrencyMediaIconProps) {
  if (url) {
    return (
      <AppImage
        src={url}
        width={16}
        height={16}
        className={cn("object-contain", className)}
      />
    );
  }
  return <Currency className={className} aria-hidden />;
}
