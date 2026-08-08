"use client";

import { useCallback, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

import {
  changeOwnPassword,
  updateOwnAvatar,
  updateOwnPersonal,
} from "@/app/[documentId]/profile/actions";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import {
  ProfilePasswordForm,
  type ProfilePasswordFormHandle,
} from "@/components/profile/profile-password-form";
import {
  ProfilePersonalForm,
  type ProfilePersonalFormHandle,
} from "@/components/profile/profile-personal-form";
import { Button } from "@/components/ui/button";
import type {
  ChangeOwnPasswordInput,
  UpdateOwnPersonalInput,
} from "@/lib/schemas/profile";
import { showErrorToast, showSuccessToast } from "@/lib/ui/app-toast";

export interface ProfileClientProps {
  userName: string;
  avatarUrl: string | null;
  personal: UpdateOwnPersonalInput;
}

function composeDisplayName(name: string, lastName: string): string {
  return [name, lastName].filter(Boolean).join(" ").trim();
}

export function ProfileClient({
  userName,
  avatarUrl,
  personal,
}: ProfileClientProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const personalRef = useRef<ProfilePersonalFormHandle>(null);
  const passwordRef = useRef<ProfilePasswordFormHandle>(null);
  const [personalDirty, setPersonalDirty] = useState(false);
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(
    () => composeDisplayName(personal.name, personal.lastName) || userName,
  );

  const handlePersonalDirty = useCallback((dirty: boolean) => {
    setPersonalDirty(dirty);
  }, []);

  const handlePasswordDirty = useCallback((dirty: boolean) => {
    setPasswordDirty(dirty);
  }, []);

  async function handleAvatarUpload(file: File): Promise<boolean> {
    const result = await updateOwnAvatar(file);
    return result.ok;
  }

  async function handlePersonalSave(
    input: UpdateOwnPersonalInput,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const result = await updateOwnPersonal(input);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }
    setDisplayName(composeDisplayName(result.name, result.lastName));
    return { ok: true };
  }

  async function handlePasswordSave(
    input: ChangeOwnPasswordInput,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const result = await changeOwnPassword(input);
    if (!result.ok) {
      if (
        result.error === "invalidCurrent" ||
        result.error === "passwordMismatch" ||
        result.error === "passwordUnchanged"
      ) {
        return { ok: false, error: result.error };
      }
      return { ok: false, error: "failed" };
    }

    if (result.jwt) {
      await signIn("credentials", { jwt: result.jwt, redirect: false });
    }
    return { ok: true };
  }

  async function handleSharedSave(): Promise<void> {
    if (!personalDirty && !passwordDirty) return;
    setSaving(true);
    try {
      let personalOk = true;
      let passwordOk = true;
      let personalFailedReason: string | null = null;
      let passwordFailedReason: string | null = null;

      if (personalDirty) {
        const result = await personalRef.current?.submit();
        personalOk = result?.ok === true;
        if (!personalOk) {
          personalFailedReason = result?.error ?? "failed";
          if (personalFailedReason === "emailTaken") {
            showErrorToast(t("emailTaken"));
          } else {
            showErrorToast(t("personalSaveFailed"));
          }
          return;
        }
      }

      if (passwordDirty) {
        const result = await passwordRef.current?.submit();
        passwordOk = result?.ok === true;
        if (!passwordOk) {
          passwordFailedReason = result?.error ?? "failed";
        }
      }

      if (personalOk && passwordOk) {
        showSuccessToast(t("profileSaved"));
        return;
      }

      if (
        passwordFailedReason === "invalidCurrent" ||
        passwordFailedReason === "passwordMismatch" ||
        passwordFailedReason === "passwordUnchanged"
      ) {
        return;
      }
      showErrorToast(t("passwordSaveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const showSave = personalDirty || passwordDirty;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <ProfileAvatarEditor
        userName={displayName}
        avatarUrl={avatarUrl}
        onUpload={handleAvatarUpload}
      />
      <ProfilePersonalForm
        ref={personalRef}
        defaultValues={personal}
        disabled={saving}
        onDirtyChange={handlePersonalDirty}
        onSave={handlePersonalSave}
      />
      <ProfilePasswordForm
        ref={passwordRef}
        disabled={saving}
        onDirtyChange={handlePasswordDirty}
        onSave={handlePasswordSave}
      />
      {showSave ? (
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSharedSave()}
        >
          {tCommon("save")}
        </Button>
      ) : null}
    </div>
  );
}
