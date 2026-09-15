"use client";

import { Pencil, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { AppImage } from "@/components/media/app-image";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { cn } from "@/lib/utils";

export interface KioskColaboratorHeaderProps {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  showEdit?: boolean;
  editOpen?: boolean;
  onEditClick?: () => void;
}

const AVATAR_CLASS =
  "relative flex size-10 shrink-0 items-center justify-center overflow-hidden " +
  "rounded-full border bg-background";

/** Colaborator identity chip; toggles edit mode when showEdit is true. */
export function KioskColaboratorHeader({
  name,
  avatarUrl,
  className,
  showEdit = false,
  editOpen = false,
  onEditClick,
}: KioskColaboratorHeaderProps) {
  const t = useTranslations("kiosk");
  const photoUrl = toBrowserMediaUrl(avatarUrl ?? null);

  const shellClass = cn(
    "relative flex min-w-0 items-center gap-2 rounded-lg border bg-background",
    "px-2 py-2",
    showEdit ? "pr-8 text-left transition-colors hover:bg-muted/40" : "pr-3",
    showEdit &&
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    editOpen && showEdit && "border-primary bg-primary/5",
    className,
  );

  const content = (
    <>
      <span className={AVATAR_CLASS}>
        {photoUrl ? (
          <AppImage src={photoUrl} fill className="object-cover" />
        ) : (
          <User className="size-5 text-muted-foreground" aria-hidden />
        )}
      </span>
      <span className="min-w-0 truncate text-base font-semibold">{name}</span>
      {showEdit ? (
        <Pencil
          className="absolute top-1.5 right-1.5 size-3.5 text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (showEdit) {
    return (
      <button
        type="button"
        className={shellClass}
        aria-label={t("editColaborator")}
        aria-pressed={editOpen}
        onClick={onEditClick}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={shellClass}
      role="group"
      aria-label={t("colaboratorHeader", { name })}
    >
      {content}
    </div>
  );
}
