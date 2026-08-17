"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { KioskColaboratorForm } from "@/components/kiosk/kiosk-colaborator-form";
import { KioskFace1nCapture } from "@/components/kiosk/kiosk-face-1n-capture";
import { KioskFaceAmbiguousList } from "@/components/kiosk/kiosk-face-ambiguous-list";
import { KioskFaceVerify } from "@/components/kiosk/kiosk-face-verify";
import { KioskHomeChooser } from "@/components/kiosk/kiosk-home-chooser";
import { useKioskIdleContext } from "@/components/kiosk/kiosk-idle-provider";
import {
  pickEntryAccessMethods,
  type EntryAccessByDevice,
  type EntryAccessMethods,
} from "@/lib/business/entry-access";
import { useEntryAccessDevice } from "@/lib/entry-access/use-entry-access-device";
import { FACE_1N_NONE_MESSAGE_MS } from "@/lib/kiosk/face/face-match-constants";
import { buildKioskColaboratorPath } from "@/lib/kiosk/kiosk-link";
import { toBrowserMediaUrl } from "@/lib/media/browser-media-url";
import { stashWelcomePayload } from "@/lib/welcome/welcome-session";

import {
  identifyKioskUserByCode,
  identifyKioskUserByFace,
  identifyKioskUserByTag,
  type KioskFaceIdentifyCandidate,
  type KioskWelcomeProfile,
} from "./actions";

type HomeStep =
  | "choose"
  | "face1n"
  | "ambiguous"
  | "face1to1"
  | "code"
  | "username";

export function KioskHomeClient({
  accessSettings,
}: {
  accessSettings?: EntryAccessByDevice;
}) {
  const t = useTranslations("kiosk");
  const router = useRouter();
  const device = useEntryAccessDevice();
  const methods: EntryAccessMethods = accessSettings
    ? pickEntryAccessMethods(accessSettings, device)
    : { username: false, code: true, face: true, nfc: true };
  const {
    startAuthCountdown,
    clearAuthCountdown,
    setAuthCancelHandler,
  } = useKioskIdleContext();
  const [step, setStep] = useState<HomeStep>("choose");
  const [selectedMember, setSelectedMember] =
    useState<KioskFaceIdentifyCandidate | null>(null);
  const [candidates, setCandidates] = useState<KioskFaceIdentifyCandidate[]>(
    [],
  );
  const [pending, setPending] = useState(false);
  const [unidentifiedMessage, setUnidentifiedMessage] = useState<string | null>(
    null,
  );
  const [errorKey, setErrorKey] = useState<
    "invalidCredentials" | "forbidden" | null
  >(null);
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
    clearAuthCountdown();
    setSelectedMember(null);
    setCandidates([]);
    setUnidentifiedMessage(null);
    setErrorKey(null);
    setPending(false);
    setStep("choose");
  }, [clearAuthCountdown, clearNoneMessageTimer]);

  const openCode = useCallback(() => {
    if (!methods.code) {
      goHome();
      return;
    }
    clearNoneMessageTimer();
    setSelectedMember(null);
    setCandidates([]);
    setUnidentifiedMessage(null);
    setErrorKey(null);
    setStep("code");
    startAuthCountdown(() => {
      goHome();
    });
  }, [clearNoneMessageTimer, goHome, methods.code, startAuthCountdown]);

  const openCamera = useCallback(() => {
    if (!methods.face) return;
    clearNoneMessageTimer();
    setSelectedMember(null);
    setCandidates([]);
    setUnidentifiedMessage(null);
    setErrorKey(null);
    setStep("face1n");
    startAuthCountdown(() => {
      if (methods.code) openCode();
      else goHome();
    });
  }, [
    clearNoneMessageTimer,
    goHome,
    methods.code,
    methods.face,
    openCode,
    startAuthCountdown,
  ]);

  useEffect(() => {
    if (!methods.face) return;
    void import("@/lib/kiosk/face/load-face-models").then(({ loadFaceModels }) => {
      void loadFaceModels().catch(() => {
        /* models warm-up is best-effort */
      });
    });
  }, [methods.face]);

  useEffect(() => {
    if (!methods.nfc) return;
    if (step !== "choose") return;

    let cancelled = false;
    const identifyingRef = { current: false };
    let stopWatcher: (() => void) | undefined;

    void import("@/lib/kiosk/nfc-read").then(
      ({ isNfcReadSupported, watchNfcSerialNumbers }) => {
        if (cancelled || !isNfcReadSupported()) return;
        const { stop } = watchNfcSerialNumbers({
          onTag: (userTag) => {
            if (cancelled || identifyingRef.current) return;
            identifyingRef.current = true;
            void (async () => {
              const result = await identifyKioskUserByTag(userTag);
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
              clearAuthCountdown();
              if (result.welcome) {
                stashWelcomePayload(result.welcome);
              }
              router.replace(result.path);
            })();
          },
        });
        stopWatcher = stop;
      },
    );

    return () => {
      cancelled = true;
      stopWatcher?.();
    };
  }, [
    methods.nfc,
    step,
    t,
    router,
    clearAuthCountdown,
    clearNoneMessageTimer,
  ]);

  useEffect(() => {
    setAuthCancelHandler(() => {
      goHome();
    });
    return () => {
      setAuthCancelHandler(null);
      clearAuthCountdown();
      clearNoneMessageTimer();
    };
  }, [clearAuthCountdown, clearNoneMessageTimer, goHome, setAuthCancelHandler]);

  const navigateToColaborator = useCallback(
    (member: KioskFaceIdentifyCandidate) => {
      clearAuthCountdown();
      stashWelcomePayload({
        name: member.name,
        greetingGender: member.greetingGender,
        avatarUrl: toBrowserMediaUrl(member.avatarUrl),
        facePhotoUrl: toBrowserMediaUrl(member.facePhotoUrl),
      });
      router.replace(buildKioskColaboratorPath(member.documentId));
    },
    [clearAuthCountdown, router],
  );

  const navigateWithWelcome = useCallback(
    (path: string, welcome: KioskWelcomeProfile | null) => {
      clearAuthCountdown();
      if (welcome) {
        stashWelcomePayload(welcome);
      }
      router.replace(path);
    },
    [clearAuthCountdown, router],
  );

  const handleFaceSuccess = useCallback(() => {
    if (!selectedMember) return;
    navigateToColaborator(selectedMember);
  }, [navigateToColaborator, selectedMember]);

  async function handleProbeReady(descriptor: number[]): Promise<void> {
    setPending(true);
    setErrorKey(null);
    const result = await identifyKioskUserByFace(descriptor);
    setPending(false);

    if (!result.ok) {
      setUnidentifiedMessage(t("face1nNone"));
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
      navigateToColaborator(result.match);
      return;
    }

    if (result.status === "ambiguous") {
      clearNoneMessageTimer();
      setUnidentifiedMessage(null);
      setCandidates(result.candidates);
      setStep("ambiguous");
      return;
    }

    setUnidentifiedMessage(t("face1nNone"));
    clearNoneMessageTimer();
    noneMessageTimerRef.current = setTimeout(() => {
      setUnidentifiedMessage(null);
    }, FACE_1N_NONE_MESSAGE_MS);
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
    navigateWithWelcome(result.path, result.welcome);
  }

  if (methods.username && step === "username") {
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

  if (methods.face && step === "face1to1" && selectedMember) {
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

  if (methods.face && step === "ambiguous") {
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

  if (methods.face && step === "face1n") {
    return (
      <KioskFace1nCapture
        disabled={pending}
        unidentifiedMessage={unidentifiedMessage}
        onProbeReady={(descriptor) => void handleProbeReady(descriptor)}
        onCancel={goHome}
      />
    );
  }

  if (methods.code && step === "code") {
    return (
      <div className="flex flex-col gap-6">
        {errorKey ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {t(errorKey)}
          </p>
        ) : null}
        <KioskColaboratorForm onSubmit={handleSubmit} pending={pending} />
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
      onUsernameLogin={
        methods.username ? () => setStep("username") : undefined
      }
      access={methods}
    />
  );
}
