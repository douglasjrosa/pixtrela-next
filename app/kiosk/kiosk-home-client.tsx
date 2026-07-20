"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { KioskColaboratorForm } from "@/components/kiosk/kiosk-colaborator-form";
import { KioskFaceVerify } from "@/components/kiosk/kiosk-face-verify";
import { KioskIdleScreen } from "@/components/kiosk/kiosk-idle-screen";
import { KioskMemberPicker } from "@/components/kiosk/kiosk-member-picker";
import { KioskTeamPicker } from "@/components/kiosk/kiosk-team-picker";
import { loadFaceModels } from "@/lib/kiosk/face/load-face-models";
import { buildKioskColaboratorPath } from "@/lib/kiosk/kiosk-link";
import type {
  KioskDirectoryColaborator,
  KioskDirectoryTeam,
} from "@/lib/kiosk/load-directory";

import {
  fetchKioskDirectoryColaborators,
  fetchKioskDirectoryTeams,
  identifyKioskUserByCode,
} from "./actions";

type HomeStep = "teams" | "members" | "face";

export function KioskHomeClient() {
  const t = useTranslations("kiosk");
  const router = useRouter();
  const [step, setStep] = useState<HomeStep>("teams");
  const [teams, setTeams] = useState<KioskDirectoryTeam[]>([]);
  const [members, setMembers] = useState<KioskDirectoryColaborator[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<KioskDirectoryTeam | null>(
    null,
  );
  const [selectedMember, setSelectedMember] =
    useState<KioskDirectoryColaborator | null>(null);
  const [pending, setPending] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [errorKey, setErrorKey] = useState<
    "invalidCredentials" | "forbidden" | null
  >(null);

  useEffect(() => {
    void loadFaceModels().catch(() => {
      /* models warm-up is best-effort */
    });
    void (async () => {
      const result = await fetchKioskDirectoryTeams();
      if (result.ok) setTeams(result.teams);
    })();
  }, []);

  const handleFaceSuccess = useCallback(() => {
    if (!selectedMember) return;
    router.replace(buildKioskColaboratorPath(selectedMember.documentId));
  }, [router, selectedMember]);

  async function handleSelectTeam(team: KioskDirectoryTeam): Promise<void> {
    setPending(true);
    setSelectedTeam(team);
    const result = await fetchKioskDirectoryColaborators(team.documentId);
    setPending(false);
    if (!result.ok) return;
    setMembers(result.colaborators);
    setStep("members");
  }

  function handleSelectMember(member: KioskDirectoryColaborator): void {
    if (!member.facePhotoUrl) return;
    setSelectedMember(member);
    setStep("face");
  }

  async function handleSubmit(values: {
    code: number;
    password: string;
  }): Promise<void> {
    setErrorKey(null);
    setPending(true);
    const result = await identifyKioskUserByCode(values.code, values.password);
    setPending(false);
    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }
    router.replace(result.path);
  }

  if (step === "face" && selectedMember?.facePhotoUrl) {
    return (
      <KioskFaceVerify
        colaboratorName={selectedMember.name}
        facePhotoUrl={selectedMember.facePhotoUrl}
        onSuccess={handleFaceSuccess}
        onCancel={() => {
          setSelectedMember(null);
          setStep("members");
        }}
        onFallbackCode={() => {
          setSelectedMember(null);
          setStep(selectedTeam ? "members" : "teams");
          setCodeOpen(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <KioskIdleScreen />

      {step === "teams" ? (
        <KioskTeamPicker
          teams={teams}
          pending={pending}
          onSelect={(team) => void handleSelectTeam(team)}
        />
      ) : null}

      {step === "members" ? (
        <KioskMemberPicker
          members={members}
          pending={pending}
          onSelect={handleSelectMember}
          onBack={() => {
            setSelectedTeam(null);
            setMembers([]);
            setStep("teams");
          }}
        />
      ) : null}

      <div className="border-t pt-4">
        <Button
          type="button"
          variant="link"
          className="mx-auto flex h-auto p-0"
          onClick={() => setCodeOpen((open) => !open)}
        >
          {codeOpen ? t("directoryHideCode") : t("directoryShowCode")}
        </Button>

        {codeOpen ? (
          <div className="mt-4">
            {errorKey ? (
              <p
                role="alert"
                className="mb-4 text-center text-sm text-destructive"
              >
                {t(errorKey)}
              </p>
            ) : null}
            <KioskColaboratorForm onSubmit={handleSubmit} pending={pending} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
