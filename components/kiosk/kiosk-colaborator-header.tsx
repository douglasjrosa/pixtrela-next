"use client";

import { User } from "lucide-react";
import { useTranslations } from "next-intl";

import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { cn } from "@/lib/utils";

export interface KioskColaboratorHeaderProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}

/** Totem header: circular avatar + colaborator name. */
export function KioskColaboratorHeader({
  name,
  avatarUrl,
  className,
}: KioskColaboratorHeaderProps) {
  const t = useTranslations("kiosk");
  const photoUrl = toBrowserMediaUrl(avatarUrl ?? null);

  return (
    <header
      className={cn(
        "flex items-center gap-3 border-b px-4 py-3",
        className,
      )}
      aria-label={t("colaboratorHeader", { name })}
    >
      <span
        className={
          "flex size-12 shrink-0 items-center justify-center overflow-hidden " +
          "rounded-full border bg-background"
        }
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <User className="size-6 text-muted-foreground" aria-hidden />
        )}
      </span>
      <h1 className="min-w-0 truncate text-xl font-semibold">{name}</h1>
    </header>
  );
}
