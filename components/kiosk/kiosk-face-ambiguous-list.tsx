"use client";

import { User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { KioskFaceIdentifyCandidate } from "@/app/kiosk/actions";
import { toBrowserStrapiMediaUrl } from "@/lib/strapi/browser-media-url";

export interface KioskFaceAmbiguousListProps {
  candidates: KioskFaceIdentifyCandidate[];
  pending?: boolean;
  onSelect: (candidate: KioskFaceIdentifyCandidate) => void;
  onRetry: () => void;
  onFallbackCode: () => void;
}

export function KioskFaceAmbiguousList({
  candidates,
  pending = false,
  onSelect,
  onRetry,
  onFallbackCode,
}: KioskFaceAmbiguousListProps) {
  const t = useTranslations("kiosk");

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">{t("faceAmbiguousTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("faceAmbiguousHint")}</p>
      </div>

      <ul className="grid gap-2">
        {candidates.map((candidate) => {
          const photoUrl =
            toBrowserStrapiMediaUrl(candidate.avatarUrl) ??
            toBrowserStrapiMediaUrl(candidate.facePhotoUrl);
          return (
            <li key={candidate.documentId}>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start gap-3 px-3 py-3 text-left"
                disabled={pending || !candidate.faceVector}
                onClick={() => onSelect(candidate)}
              >
                <span
                  className={
                    "flex size-12 shrink-0 items-center justify-center " +
                    "overflow-hidden rounded-full border bg-background"
                  }
                >
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoUrl}
                      alt=""
                      className="size-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <User
                      className="size-6 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </span>
                <span className="truncate font-medium">{candidate.name}</span>
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" onClick={onRetry}>
          {t("faceAmbiguousRetry")}
        </Button>
        <Button type="button" variant="link" onClick={onFallbackCode}>
          {t("faceVerifyUseCode")}
        </Button>
      </div>
    </div>
  );
}
