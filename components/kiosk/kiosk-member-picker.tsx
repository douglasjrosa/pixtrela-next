"use client";

import { User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";
import { cn } from "@/lib/utils";

export type KioskMemberOption = {
  documentId: string;
  name: string;
  facePhotoUrl: string | null;
};

export interface KioskMemberPickerProps {
  members: KioskMemberOption[];
  pending?: boolean;
  onSelect: (member: KioskMemberOption) => void;
  onBack: () => void;
}

export function KioskMemberPicker({
  members,
  pending = false,
  onSelect,
  onBack,
}: KioskMemberPickerProps) {
  const t = useTranslations("kiosk");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("directoryPickMember")}</h2>
        <Button type="button" variant="link" className="h-auto p-0" onClick={onBack}>
          {t("directoryBackTeams")}
        </Button>
      </div>

      {members.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("directoryMembersEmpty")}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {members.map((member) => {
            const photoUrl = resolveStrapiMediaUrl(member.facePhotoUrl);
            const canVerify = Boolean(photoUrl);
            return (
              <li key={member.documentId}>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-auto w-full justify-start gap-3 px-3 py-3 text-left",
                    !canVerify && "opacity-60",
                  )}
                  disabled={pending || !canVerify}
                  title={
                    canVerify ? undefined : t("directoryMemberNoFacePhoto")
                  }
                  onClick={() => onSelect(member)}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-background">
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photoUrl}
                        alt=""
                        className="size-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <User className="size-6 text-muted-foreground" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{member.name}</span>
                    {!canVerify ? (
                      <span className="block text-xs text-muted-foreground">
                        {t("directoryMemberNoFacePhoto")}
                      </span>
                    ) : null}
                  </span>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
