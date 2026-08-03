"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { KioskColaboratorForm } from "@/components/kiosk/kiosk-colaborator-form";
import { KioskFace1nCapture } from "@/components/kiosk/kiosk-face-1n-capture";
import { KioskFaceAmbiguousList } from "@/components/kiosk/kiosk-face-ambiguous-list";
import { KioskFaceVerify } from "@/components/kiosk/kiosk-face-verify";
import { KioskFaceWelcome } from "@/components/kiosk/kiosk-face-welcome";
import { KioskHomeChooser } from "@/components/kiosk/kiosk-home-chooser";
import type { Role } from "@/lib/auth/nav";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-destination";
import { FACE_1N_NONE_MESSAGE_MS } from "@/lib/kiosk/face/face-match-constants";
import { loadFaceModels } from "@/lib/kiosk/face/load-face-models";
import { isNfcReadSupported, watchNfcSerialNumbers } from "@/lib/kiosk/nfc-read";
import { resolveStrapiMediaUrl } from "@/lib/strapi/media-url";

import {
  loginByCode,
  loginByFace,
  loginByFaceConfirm,
  loginByTag,
  type AuthFaceCandidate,
} from "@/app/login/actions";

type LoginStep =
  | "choose"
  | "face1n"
  | "ambiguous"
  | "face1to1"
  | "welcome"
  | "code"
  | "username";

async function establishSessionFromJwt(jwt: string): Promise<boolean> {
  const result = await signIn("credentials", { jwt, redirect: false });
  return !result?.error;
}

export function LoginEntryClient() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [step, setStep] = useState<LoginStep>("choose");
  const [selectedMember, setSelectedMember] =
    useState<AuthFaceCandidate | null>(null);
  const [candidates, setCandidates] = useState<AuthFaceCandidate[]>([]);
  const [pending, setPending] = useState(false);
  const [unidentifiedMessage, setUnidentifiedMessage] = useState<string | null>(
    null,
  );
  const [errorKey, setErrorKey] = useState<
    "invalidCredentials" | "forbidden" | null
  >(null);
  const [pendingJwt, setPendingJwt] = useState<string | null>(null);
  const lastProbeRef = useRef<number[] | null>(null);
  const noneMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearNoneMessageTimer = useCallback(() => {
    if (noneMessageTimerRef.current) {
      clearTimeout(noneMessageTimerRef.current);
      noneMessageTimerRef.current = null;
    }
  }, []);

  const goHome = useCallback(() => {
    clearNoneMessageTimer();
    setSelectedMember(null);
    setCandidates([]);
    setUnidentifiedMessage(null);
    setErrorKey(null);
    setPending(false);
    setPendingJwt(null);
    lastProbeRef.current = null;
    setStep("choose");
  }, [clearNoneMessageTimer]);

  const finishWithJwt = useCallback(
    async (jwt: string) => {
      const ok = await establishSessionFromJwt(jwt);
      if (!ok) {
        setErrorKey("invalidCredentials");
        setStep("choose");
        return;
      }
      const session = await getSession();
      const destination = resolvePostLoginDestination(
        session?.user?.role as Role | undefined,
        session?.user?.id,
        callbackUrl,
      );
      router.push(destination);
      router.refresh();
    },
    [callbackUrl, router],
  );

  const openCode = useCallback(() => {
    clearNoneMessageTimer();
    setSelectedMember(null);
    setCandidates([]);
    setUnidentifiedMessage(null);
    setErrorKey(null);
    setStep("code");
  }, [clearNoneMessageTimer]);

  const openCamera = useCallback(() => {
    clearNoneMessageTimer();
    setSelectedMember(null);
    setCandidates([]);
    setUnidentifiedMessage(null);
    setErrorKey(null);
    setStep("face1n");
  }, [clearNoneMessageTimer]);

  useEffect(() => {
    void loadFaceModels().catch(() => {
      /* best-effort warm-up */
    });
  }, []);

  useEffect(() => {
    if (step !== "choose") return;
    if (!isNfcReadSupported()) return;

    let cancelled = false;
    const identifyingRef = { current: false };

    const { stop } = watchNfcSerialNumbers({
      onTag: (userTag) => {
        if (cancelled || identifyingRef.current) return;
        identifyingRef.current = true;
        void (async () => {
          const result = await loginByTag(userTag);
          if (cancelled) return;
          if (!result.ok) {
            setUnidentifiedMessage(t("tagNotFound"));
            clearNoneMessageTimer();
            noneMessageTimerRef.current = setTimeout(() => {
              setUnidentifiedMessage(null);
            }, FACE_1N_NONE_MESSAGE_MS);
            identifyingRef.current = false;
            return;
          }
          await finishWithJwt(result.jwt);
        })();
      },
    });

    return () => {
      cancelled = true;
      stop();
    };
  }, [step, t, clearNoneMessageTimer, finishWithJwt]);

  useEffect(() => {
    return () => {
      clearNoneMessageTimer();
    };
  }, [clearNoneMessageTimer]);

  const navigateAfterWelcome = useCallback(() => {
    if (!pendingJwt) return;
    void finishWithJwt(pendingJwt);
  }, [finishWithJwt, pendingJwt]);

  const handleFaceSuccess = useCallback(() => {
    if (!selectedMember) return;
    const probe = lastProbeRef.current;
    if (!probe) {
      setErrorKey("invalidCredentials");
      setStep("choose");
      return;
    }
    setPending(true);
    void (async () => {
      const result = await loginByFaceConfirm(selectedMember.documentId, probe);
      setPending(false);
      if (!result.ok || result.status !== "match") {
        setErrorKey("invalidCredentials");
        setStep("face1n");
        return;
      }
      setPendingJwt(result.jwt);
      setSelectedMember(result.match);
      setStep("welcome");
    })();
  }, [selectedMember]);

  async function handleProbeReady(descriptor: number[]): Promise<void> {
    lastProbeRef.current = descriptor;
    setPending(true);
    setErrorKey(null);
    const result = await loginByFace(descriptor);
    setPending(false);

    if (!result.ok) {
      setUnidentifiedMessage(t("invalidCredentials"));
      clearNoneMessageTimer();
      noneMessageTimerRef.current = setTimeout(() => {
        setUnidentifiedMessage(null);
      }, FACE_1N_NONE_MESSAGE_MS);
      return;
    }

    if (result.status === "match") {
      clearNoneMessageTimer();
      setSelectedMember(result.match);
      setPendingJwt(result.jwt);
      setUnidentifiedMessage(null);
      setStep("welcome");
      return;
    }

    if (result.status === "ambiguous") {
      clearNoneMessageTimer();
      setUnidentifiedMessage(null);
      setCandidates(result.candidates);
      setStep("ambiguous");
      return;
    }

    setUnidentifiedMessage(t("invalidCredentials"));
    clearNoneMessageTimer();
    noneMessageTimerRef.current = setTimeout(() => {
      setUnidentifiedMessage(null);
    }, FACE_1N_NONE_MESSAGE_MS);
  }

  function handleSelectAmbiguous(candidate: AuthFaceCandidate): void {
    setSelectedMember(candidate);
    setStep("face1to1");
  }

  async function handleSubmit(values: {
    code: number;
    password: string;
  }): Promise<void> {
    setErrorKey(null);
    setPending(true);
    const result = await loginByCode(values.code, values.password);
    setPending(false);
    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }
    await finishWithJwt(result.jwt);
  }

  if (step === "username") {
    return (
      <div className="flex flex-col gap-4">
        <LoginForm />
        <div className="text-center">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={goHome}
          >
            {t("homeBackToChooser")}
          </Button>
        </div>
      </div>
    );
  }

  if (step === "welcome" && selectedMember) {
    return (
      <KioskFaceWelcome
        name={selectedMember.name}
        greetingGender={selectedMember.greetingGender}
        avatarUrl={resolveStrapiMediaUrl(selectedMember.avatarUrl)}
        facePhotoUrl={resolveStrapiMediaUrl(selectedMember.facePhotoUrl)}
        onDone={navigateAfterWelcome}
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
        onCancel={openCamera}
        onFallbackCode={openCode}
      />
    );
  }

  if (step === "ambiguous") {
    return (
      <KioskFaceAmbiguousList
        candidates={candidates}
        pending={pending}
        onSelect={handleSelectAmbiguous}
        onRetry={openCamera}
        onFallbackCode={openCode}
      />
    );
  }

  if (step === "face1n") {
    return (
      <KioskFace1nCapture
        disabled={pending}
        unidentifiedMessage={unidentifiedMessage}
        onProbeReady={(descriptor) => void handleProbeReady(descriptor)}
        onCancel={goHome}
      />
    );
  }

  if (step === "code") {
    return (
      <div className="flex flex-col gap-6">
        {errorKey ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {t(errorKey)}
          </p>
        ) : null}
        <KioskColaboratorForm
          onSubmit={handleSubmit}
          pending={pending}
          messagesNamespace="auth"
        />
        <div className="text-center">
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={goHome}
          >
            {t("homeBackToChooser")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <KioskHomeChooser
      onCamera={openCamera}
      onPassword={openCode}
      message={unidentifiedMessage}
      messagesNamespace="auth"
      onUsernameLogin={() => setStep("username")}
    />
  );
}
