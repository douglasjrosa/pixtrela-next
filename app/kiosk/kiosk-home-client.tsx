"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { KioskColaboratorForm } from "@/components/kiosk/kiosk-colaborator-form";
import { KioskFace1nCapture } from "@/components/kiosk/kiosk-face-1n-capture";
import { KioskFaceAmbiguousList } from "@/components/kiosk/kiosk-face-ambiguous-list";
import { KioskFaceVerify } from "@/components/kiosk/kiosk-face-verify";
import { KioskFaceWelcome } from "@/components/kiosk/kiosk-face-welcome";
import { KioskIdleScreen } from "@/components/kiosk/kiosk-idle-screen";
import { loadFaceModels } from "@/lib/kiosk/face/load-face-models";
import { buildKioskColaboratorPath } from "@/lib/kiosk/kiosk-link";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

import {
  identifyKioskUserByCode,
  identifyKioskUserByFace,
  type KioskFaceIdentifyCandidate,
} from "./actions";

type HomeStep = "face1n" | "ambiguous" | "face1to1" | "welcome" | "code";

const NONE_RETRY_BEFORE_CODE = 2;

export function KioskHomeClient() {
  const t = useTranslations("kiosk");
  const router = useRouter();
  const [step, setStep] = useState<HomeStep>("face1n");
  const [selectedMember, setSelectedMember] =
    useState<KioskFaceIdentifyCandidate | null>(null);
  const [candidates, setCandidates] = useState<KioskFaceIdentifyCandidate[]>(
    [],
  );
  const [pending, setPending] = useState(false);
  const [noneAttempts, setNoneAttempts] = useState(0);
  const [face1nKey, setFace1nKey] = useState(0);
  const [errorKey, setErrorKey] = useState<
    "invalidCredentials" | "forbidden" | "face1nNone" | null
  >(null);

  useEffect(() => {
    void loadFaceModels().catch(() => {
      /* models warm-up is best-effort */
    });
  }, []);

  const openCodeFallback = useCallback(() => {
    setSelectedMember(null);
    setCandidates([]);
    setStep("code");
  }, []);

  const restartFace1n = useCallback(() => {
    setSelectedMember(null);
    setCandidates([]);
    setErrorKey(null);
    setFace1nKey((key) => key + 1);
    setStep("face1n");
  }, []);

  const navigateToColaborator = useCallback(() => {
    if (!selectedMember) return;
    router.replace(buildKioskColaboratorPath(selectedMember.documentId));
  }, [router, selectedMember]);

  const handleFaceSuccess = useCallback(() => {
    if (!selectedMember) return;
    setStep("welcome");
  }, [selectedMember]);

  async function handleProbeReady(descriptor: number[]): Promise<void> {
    setPending(true);
    setErrorKey(null);
    const result = await identifyKioskUserByFace(descriptor);
    setPending(false);

    if (!result.ok) {
      setErrorKey("forbidden");
      openCodeFallback();
      return;
    }

    if (result.status === "match") {
      setSelectedMember(result.match);
      setNoneAttempts(0);
      setStep("welcome");
      return;
    }

    if (result.status === "ambiguous") {
      setCandidates(result.candidates);
      setNoneAttempts(0);
      setStep("ambiguous");
      return;
    }

    const nextAttempts = noneAttempts + 1;
    setNoneAttempts(nextAttempts);
    if (nextAttempts >= NONE_RETRY_BEFORE_CODE) {
      setErrorKey("face1nNone");
      openCodeFallback();
      return;
    }

    setErrorKey("face1nNone");
    setFace1nKey((key) => key + 1);
    setStep("face1n");
  }

  function handleSelectAmbiguous(candidate: KioskFaceIdentifyCandidate): void {
    setSelectedMember(candidate);
    setStep("face1to1");
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

  if (step === "welcome" && selectedMember) {
    return (
      <KioskFaceWelcome
        name={selectedMember.name}
        greetingGender={selectedMember.greetingGender}
        avatarUrl={resolveStrapiMediaUrl(selectedMember.avatarUrl)}
        facePhotoUrl={resolveStrapiMediaUrl(selectedMember.facePhotoUrl)}
        onDone={navigateToColaborator}
      />
    );
  }

  if (step === "face1to1" && selectedMember) {
    return (
      <KioskFaceVerify
        colaboratorName={selectedMember.name}
        referenceDescriptor={selectedMember.faceVector}
        facePhotoUrl={selectedMember.facePhotoUrl}
        onSuccess={handleFaceSuccess}
        onCancel={restartFace1n}
        onFallbackCode={openCodeFallback}
      />
    );
  }

  if (step === "ambiguous") {
    return (
      <KioskFaceAmbiguousList
        candidates={candidates}
        pending={pending}
        onSelect={handleSelectAmbiguous}
        onRetry={restartFace1n}
        onFallbackCode={openCodeFallback}
      />
    );
  }

  if (step === "face1n") {
    return (
      <div className="flex flex-col gap-6">
        <KioskFace1nCapture
          key={face1nKey}
          disabled={pending}
          onProbeReady={(descriptor) => void handleProbeReady(descriptor)}
          onCancel={openCodeFallback}
          onFallbackCode={openCodeFallback}
        />
        {errorKey === "face1nNone" ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {t("face1nNone")}
          </p>
        ) : null}
        <div className="border-t pt-4 text-center">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={openCodeFallback}
          >
            {t("directoryShowCode")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <KioskIdleScreen />

      {errorKey && errorKey !== "face1nNone" ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {t(errorKey)}
        </p>
      ) : errorKey === "face1nNone" ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {t("face1nNone")}
        </p>
      ) : null}

      <KioskColaboratorForm onSubmit={handleSubmit} pending={pending} />

      <div className="border-t pt-4 text-center">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={restartFace1n}
        >
          {t("face1nRetryCamera")}
        </Button>
      </div>
    </div>
  );
}
