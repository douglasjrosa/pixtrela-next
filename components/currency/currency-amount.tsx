import type { ReactNode } from "react";

import { OptimizedMediaImage } from "@/components/media/optimized-media-image";
import { cn } from "@/lib/utils";

const CURRENCY_ICON_SIZE = {
  sm: 16,
  md: 20,
} as const;

export type CurrencyAmountProps = {
  iconUrl: string | null;
  children: ReactNode;
  className?: string;
  iconSize?: keyof typeof CURRENCY_ICON_SIZE;
};

export function CurrencyAmount({
  iconUrl,
  children,
  className,
  iconSize = "sm",
}: CurrencyAmountProps) {
  const size = CURRENCY_ICON_SIZE[iconSize];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {iconUrl ? (
        <OptimizedMediaImage src={iconUrl} width={size} height={size} />
      ) : null}
      {children}
    </span>
  );
}
