"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { loadReferenceFaceDescriptor } from "@/lib/kiosk/face/load-reference-descriptor";
import { loadFaceModels } from "@/lib/kiosk/face/load-face-models";
import {
  stopMediaStream,
  verifyFaceAgainstPhoto,
  type FaceVerifyStatus,
} from "@/lib/kiosk/face/verify-face-against-photo";

export interface KioskFaceVerifyProps {
  colaboratorName: string;
  facePhotoUrl: string;
  onSuccess: () => void;
  onCancel: () => void;
  onFallbackCode: () => void;
}

function statusMessageKey(
  status: FaceVerifyStatus,
):
  | "faceVerifyMatching"
  | "faceVerifyNoFace"
  | "faceVerifyMultipleFaces"
  | "faceVerifyTooSmall"
  | "faceVerifyMismatch"
  | "faceVerifyTimeout"
  | "faceVerifyPreparing" {
  if (status === "no_face") return "faceVerifyNoFace";
  if (status === "multiple_faces") return "faceVerifyMultipleFaces";
  if (status === "too_small") return "faceVerifyTooSmall";
  if (status === "mismatch") return "faceVerifyMismatch";
  if (status === "timeout") return "faceVerifyTimeout";
  if (status === "matching" || status === "success") return "faceVerifyMatching";
  return "faceVerifyPreparing";
}

export function KioskFaceVerify({
  colaboratorName,
  facePhotoUrl,
  onSuccess,
  onCancel,
  onFallbackCode,
}: KioskFaceVerifyProps) {
  const t = useTranslations("kiosk");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<FaceVerifyStatus>("matching");
  const [phase, setPhase] = useState<"preparing" | "camera" | "done">("preparing");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    abortRef.current = abort;
    let cancelled = false;
    const success = onSuccess;

    async function run(): Promise<void> {
      try {
        await loadFaceModels();
        const reference = await loadReferenceFaceDescriptor(facePhotoUrl);
        if (cancelled || abort.signal.aborted) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled || abort.signal.aborted) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stopMediaStream(stream);
          return;
        }

        video.srcObject = stream;
        await video.play();
        setPhase("camera");

        const result = await verifyFaceAgainstPhoto({
          video,
          referenceDescriptor: reference,
          signal: abort.signal,
          onStatus: setStatus,
        });

        if (cancelled || abort.signal.aborted) return;

        stopMediaStream(streamRef.current);
        streamRef.current = null;
        setPhase("done");

        if (result.status === "success") {
          success();
          return;
        }

        setStatus(result.status);
        if (result.status === "timeout") {
          setErrorKey("faceVerifyTimeout");
        } else if (result.status !== "aborted") {
          setErrorKey(statusMessageKey(result.status));
        }
      } catch {
        if (!cancelled) {
          setPhase("done");
          setErrorKey("faceVerifyFailed");
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
      abort.abort();
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
    // Intentionally only re-run when the reference photo changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facePhotoUrl]);

  function handleCancel(): void {
    abortRef.current?.abort();
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    onCancel();
  }

  function handleFallback(): void {
    abortRef.current?.abort();
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    onFallbackCode();
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">{t("faceVerifyTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("faceVerifyFor", { name: colaboratorName })}
        </p>
        <p className="text-xs text-muted-foreground">{t("faceVerifyPrivacy")}</p>
      </div>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[70%] w-[62%] rounded-[50%] border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
      </div>

      <p role="status" className="text-center text-sm">
        {phase === "preparing"
          ? t("faceVerifyPreparing")
          : errorKey
            ? t(errorKey)
            : t(statusMessageKey(status))}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" onClick={handleCancel}>
          {t("faceVerifyCancel")}
        </Button>
        {errorKey ? (
          <Button type="button" onClick={handleFallback}>
            {t("faceVerifyUseCode")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
