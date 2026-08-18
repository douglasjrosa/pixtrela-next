"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export interface AppBrandLinkProps {
  href: string;
  /** Resolved R2/media URL for the menu logo mark. */
  logoUrl?: string | null;
  className?: string;
  nameClassName?: string;
}

/** Home link with optional brand mark image and app name. */
export function AppBrandLink({
  href,
  logoUrl = null,
  className,
  nameClassName,
}: AppBrandLinkProps) {
  const t = useTranslations("app");

  return (
    <Link href={href} className={cn("flex shrink-0 items-center gap-2", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- R2 /api media URLs
        <img
          src={logoUrl}
          alt=""
          width={28}
          height={28}
          className="size-7 shrink-0 object-contain"
        />
      ) : null}
      <span className={cn("font-bold", nameClassName)}>{t("name")}</span>
    </Link>
  );
}
