"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { AppImage } from "@/components/media/app-image";
import { resolveMenuLogoBackgroundStyle } from "@/lib/themes/menu-logo-background";
import { cn } from "@/lib/utils";

export interface AppBrandLinkProps {
  href: string;
  /** Resolved R2/media URL for the menu logo mark. */
  logoUrl?: string | null;
  menuLogoBackgroundColor?: string | null;
  menuLogoBackgroundColorOpacity?: number | null;
  className?: string;
  nameClassName?: string;
}

/** Home link with optional brand mark image and app name. */
export function AppBrandLink({
  href,
  logoUrl = null,
  menuLogoBackgroundColor = null,
  menuLogoBackgroundColorOpacity = null,
  className,
  nameClassName,
}: AppBrandLinkProps) {
  const t = useTranslations("app");
  const logoBackground = resolveMenuLogoBackgroundStyle(
    menuLogoBackgroundColor,
    menuLogoBackgroundColorOpacity,
  );

  return (
    <Link href={href} className={cn("flex shrink-0 items-center gap-2", className)}>
      {logoUrl ? (
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-sm p-0.5"
          style={{ backgroundColor: logoBackground }}
        >
          <AppImage
            src={logoUrl}
            width={28}
            height={28}
            className="size-full object-contain"
          />
        </span>
      ) : null}
      <span className={cn("font-bold", nameClassName)}>{t("name")}</span>
    </Link>
  );
}
