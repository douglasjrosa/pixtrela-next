"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { APP_LOGO_MARK } from "@/lib/assets/branding";
import { cn } from "@/lib/utils";

export interface AppBrandLinkProps {
  href: string;
  className?: string;
  nameClassName?: string;
}

/** Home link with brand mark image and app name. */
export function AppBrandLink({
  href,
  className,
  nameClassName,
}: AppBrandLinkProps) {
  const t = useTranslations("app");

  return (
    <Link href={href} className={cn("flex shrink-0 items-center gap-2", className)}>
      <Image
        src={APP_LOGO_MARK}
        alt=""
        width={32}
        height={32}
        className="size-7 shrink-0"
        priority
      />
      <span className={cn("font-bold", nameClassName)}>{t("name")}</span>
    </Link>
  );
}
