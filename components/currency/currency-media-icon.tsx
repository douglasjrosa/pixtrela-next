import { Currency } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CurrencyMediaIconProps {
  url: string | null | undefined;
  className?: string;
}

/** Renders Currency.iconMedia when present; Lucide Currency as fallback. */
export function CurrencyMediaIcon({ url, className }: CurrencyMediaIconProps) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        role="presentation"
        className={cn("object-contain", className)}
      />
    );
  }
  return <Currency className={className} aria-hidden />;
}
