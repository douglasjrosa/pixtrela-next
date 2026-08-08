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
import { KioskHomeChooser } from "@/components/kiosk/kiosk-home-chooser";
import type { Role } from "@/lib/auth/nav";
import { resolvePostLoginDestination } from "@/lib/auth/post-login-destination";
import { FACE_1N_NONE_MESSAGE_MS } from "@/lib/kiosk/face/face-match-constants";
import { loadFaceModels } from "@/lib/kiosk/face/load-face-models";
import { isNfcReadSupported, watchNfcSerialNumbers } from "@/lib/kiosk/nfc-read";
import { stashWelcomePayload } from "@/lib/welcome/welcome-session";

import {
  loginByCode,
  loginByFace,
  loginByFaceConfirm,
  loginByTag,
  type AuthFaceCandidate,
  type AuthWelcomeProfile,
} from "@/app/login/actions";

type LoginStep =
  | "choose"
  | "face1n"
  | "ambiguous"
  | "face1to1"
  | "code"
  | "username";

async function establishSessionFromJwt(jwt: string): Promise<boolean> {
  const result = await signIn("credentials", {
    jwt,
    redirect: false,
    callbackUrl: "/",
  });
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
  const lastProbeRef = useRef<number[] | null>(null);
  const finishingRef = useRef(false);
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
    finishingRef.current = false;
    setSelectedMember(null);
    setCandidates([]);
    setUnidentifiedMessage(null);
    setErrorKey(null);
    setPending(false);
    lastProbeRef.current = null;
    setStep("choose");
  }, [clearNoneMessageTimer]);

  const finishWithJwt = useCallback(
    async (jwt: string, welcome?: AuthWelcomeProfile | null) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setPending(true);
      const ok = await establishSessionFromJwt(jwt);
      if (!ok) {
        finishingRef.current = false;
        setPending(false);
        setErrorKey("invalidCredentials");
        setStep("choose");
        return;
      }
      if (welcome) {
        stashWelcomePayload(welcome);
      }
      const session = await getSession();
      const destination = resolvePostLoginDestination(
        session?.user?.role as Role | undefined,
        session?.user?.id,
        callbackUrl,
      );
      // Avoid refresh-while-push races that re-POST Server Actions mid-redirect.
      router.replace(destination);
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
        if (cancelled || identifyingRef.current || finishingRef.current) return;
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
          await finishWithJwt(result.jwt, result.welcome);
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

  const handleFaceSuccess = useCallback(() => {
    if (!selectedMember || finishingRef.current) return;
    const probe = lastProbeRef.current;
    if (!probe) {
      setErrorKey("invalidCredentials");
      setStep("choose");
      return;
    }
    setPending(true);
    void (async () => {
      const result = await loginByFaceConfirm(selectedMember.documentId, probe);
      if (finishingRef.current) return;
      setPending(false);
      if (!result.ok || result.status !== "match") {
        setErrorKey("invalidCredentials");
        setStep("face1n");
        return;
      }
      setSelectedMember(result.match);
      await finishWithJwt(result.jwt, result.welcome);
    })();
  }, [finishWithJwt, selectedMember]);

  async function handleProbeReady(descriptor: number[]): Promise<void> {
    if (finishingRef.current || pending) return;
    lastProbeRef.current = descriptor;
    setPending(true);
    setErrorKey(null);
    const result = await loginByFace(descriptor);
    if (finishingRef.current) return;
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
      setUnidentifiedMessage(null);
      await finishWithJwt(result.jwt, result.welcome);
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
    if (finishingRef.current || pending) return;
    setErrorKey(null);
    setPending(true);
    const result = await loginByCode(values.code, values.password);
    if (finishingRef.current) return;
    setPending(false);
    if (!result.ok) {
      setErrorKey(result.error);
      return;
    }
    await finishWithJwt(result.jwt, result.welcome);
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
