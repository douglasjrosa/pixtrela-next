"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { KIOSK_HOME_PATH } from "@/lib/auth/colaborator-routes";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

import {
  saveKioskColaboratorAvatar,
  saveKioskColaboratorPassword,
  type KioskColaboratorPasswordResult,
} from "@/app/kiosk/staff/[userId]/users/actions";
import { KioskColaboratorAvatarForm } from "./kiosk-colaborator-avatar-form";
import { KioskColaboratorPasswordForm } from "./kiosk-colaborator-password-form";
import { KioskSessionExitButton } from "./kiosk-session-exit-button";

type PasswordSaveError = Extract<
  KioskColaboratorPasswordResult,
  { ok: false }
>["error"];

function passwordErrorMessage(
  error: PasswordSaveError,
  t: (key: string) => string,
): string {
  if (error === "passwordMismatch") return t("staffPasswordMismatch");
  if (error === "invalid") return t("staffPasswordInvalid");
  return t("staffPasswordForbidden");
}

export interface KioskStaffColaboratorRow {
  documentId: string;
  name: string;
  code: number;
  avatarUrl?: string | null;
}

export interface KioskStaffUsersPanelProps {
  userId: string;
  colaborators: KioskStaffColaboratorRow[];
  canSignOut: boolean;
}

export function KioskStaffUsersPanel({
  userId,
  colaborators,
  canSignOut,
}: KioskStaffUsersPanelProps) {
  const t = useTranslations("kiosk");
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string | null>>({});

  const selectedColaborator = colaborators.find(
    (colaborator) => colaborator.documentId === selectedId,
  );
  const selectedAvatarUrl =
    selectedId !== null
      ? avatarUrls[selectedId] ?? selectedColaborator?.avatarUrl ?? null
      : null;

  function handleSelect(documentId: string): void {
    setSelectedId(documentId);
  }

  function handleBackToList(): void {
    setSelectedId(null);
  }

  async function handleSaveAvatar(
    colaboratorDocumentId: string,
    file: File,
  ): Promise<boolean> {
    setPending(true);
    try {
      const result = await saveKioskColaboratorAvatar(
        userId,
        colaboratorDocumentId,
        file,
      );
      if (!result.ok) {
        showErrorToast(t("staffAvatarForbidden"));
        return false;
      }
      setAvatarUrls((current) => ({
        ...current,
        [colaboratorDocumentId]: result.avatarUrl,
      }));
      showSuccessToast(t("staffAvatarSaved"));
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleSave(
    colaboratorDocumentId: string,
    input: { password: string; confirmPassword: string },
  ): Promise<boolean> {
    setPending(true);
    try {
      const result = await saveKioskColaboratorPassword(
        userId,
        colaboratorDocumentId,
        input,
      );
      if (!result.ok) {
        showErrorToast(passwordErrorMessage(result.error, t));
        router.replace(KIOSK_HOME_PATH);
        return false;
      }
      showSuccessToast(t("staffPasswordSaved"));
      router.replace(KIOSK_HOME_PATH);
      return true;
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t("usersPage")}</h1>
          <Link
            href={`/kiosk/staff/${userId}`}
            className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
          >
            {t("staffBack")}
          </Link>
        </div>
        <KioskSessionExitButton visible={canSignOut} />
      </header>

      {colaborators.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("staffUsersEmpty")}
        </p>
      ) : selectedColaborator ? (
        <div className="space-y-4">
          <Button type="button" variant="link" className="h-auto p-0" onClick={handleBackToList}>
            {t("staffBackToList")}
          </Button>
          <KioskColaboratorAvatarForm
            avatarUrl={selectedAvatarUrl}
            disabled={pending}
            onSave={(file) => handleSaveAvatar(selectedColaborator.documentId, file)}
          />
          <KioskColaboratorPasswordForm
            colaboratorName={selectedColaborator.name}
            disabled={pending}
            onCancel={handleBackToList}
            onSave={(input) => handleSave(selectedColaborator.documentId, input)}
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-3 text-left font-medium">{t("staffUserName")}</th>
                <th className="p-3 text-left font-medium">{t("staffUserCode")}</th>
              </tr>
            </thead>
            <tbody>
              {colaborators.map((colaborator) => (
                <tr key={colaborator.documentId} className="border-b last:border-b-0">
                  <td colSpan={2} className="p-0">
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between gap-4 p-3 text-left",
                        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2",
                      )}
                      onClick={() => handleSelect(colaborator.documentId)}
                    >
                      <span>{colaborator.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {colaborator.code}
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
