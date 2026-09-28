"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { AppImage } from "@/components/media/app-image";
import { resolveMenuLogoBackgroundStyle } from "@/lib/themes/menu-logo-background";
import {
  APP_MENU_LOGO_TRAILING_SPACING_CLASS,
  APP_MENU_LOGO_SIZE_CLASS,
  APP_MENU_LOGO_SIZE_PX,
} from "@/lib/ui/menu-logo-dimensions";
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
    <Link
      href={href}
      className={cn(
        "flex max-h-full shrink-0 items-center gap-2",
        logoUrl ? APP_MENU_LOGO_TRAILING_SPACING_CLASS : null,
        className,
      )}
    >
      {logoUrl ? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-sm p-0.5",
            APP_MENU_LOGO_SIZE_CLASS,
          )}
          style={{ backgroundColor: logoBackground }}
        >
          <AppImage
            src={logoUrl}
            width={APP_MENU_LOGO_SIZE_PX}
            height={APP_MENU_LOGO_SIZE_PX}
            className="size-full max-h-full object-contain"
          />
        </span>
      ) : null}
      <span className={cn("font-bold", nameClassName)}>{t("name")}</span>
    </Link>
  );
}
