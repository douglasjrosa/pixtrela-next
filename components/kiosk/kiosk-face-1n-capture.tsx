"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { FaceOvalFrame } from "@/components/kiosk/face-oval-frame";
import { Button } from "@/components/ui/button";
import { detectSingleFaceDescriptor } from "@/lib/kiosk/face/detect-single-descriptor";
import {
  FACE_VERIFY_THROTTLE_MS,
  FACE_VERIFY_TIMEOUT_MS,
} from "@/lib/kiosk/face/face-match-constants";
import { loadFaceModels } from "@/lib/kiosk/face/load-face-models";
import { stopMediaStream } from "@/lib/kiosk/face/verify-face-against-photo";

export type Face1nCaptureStatus =
  | "preparing"
  | "looking"
  | "no_face"
  | "multiple_faces"
  | "too_small"
  | "identifying"
  | "timeout"
  | "failed";

export interface KioskFace1nCaptureProps {
  onProbeReady: (descriptor: number[]) => void | Promise<void>;
  onCancel: () => void;
  onFallbackCode: () => void;
  disabled?: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function statusMessageKey(status: Face1nCaptureStatus): string {
  if (status === "preparing") return "face1nPreparing";
  if (status === "looking" || status === "identifying") return "face1nLooking";
  if (status === "no_face") return "faceVerifyNoFace";
  if (status === "multiple_faces") return "faceVerifyMultipleFaces";
  if (status === "too_small") return "faceVerifyTooSmall";
  if (status === "timeout") return "face1nTimeout";
  return "face1nFailed";
}

/**
 * Samples the camera until one face descriptor is obtained, then hands it off.
 */
export function KioskFace1nCapture({
  onProbeReady,
  onCancel,
  onFallbackCode,
  disabled = false,
}: KioskFace1nCaptureProps) {
  const t = useTranslations("kiosk");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<Face1nCaptureStatus>("preparing");

  useEffect(() => {
    const abort = new AbortController();
    abortRef.current = abort;
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        await loadFaceModels();
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
        setStatus("looking");

        const startedAt = Date.now();
        while (!cancelled && !abort.signal.aborted) {
          if (Date.now() - startedAt >= FACE_VERIFY_TIMEOUT_MS) {
            setStatus("timeout");
            return;
          }

          const detection = await detectSingleFaceDescriptor(video);
          if (cancelled || abort.signal.aborted) return;

          if (detection.ok === false) {
            setStatus(detection.reason);
            await sleep(FACE_VERIFY_THROTTLE_MS);
            continue;
          }

          setStatus("identifying");
          stopMediaStream(streamRef.current);
          streamRef.current = null;
          await onProbeReady(Array.from(detection.descriptor));
          return;
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    void run();

    return () => {
      cancelled = true;
      abort.abort();
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const statusKey = statusMessageKey(status);

  const showFallback =
    status === "timeout" || status === "failed" || disabled;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold">{t("face1nTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("face1nHint")}</p>
        <p className="text-xs text-muted-foreground">{t("face1nPrivacy")}</p>
      </div>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <FaceOvalFrame />
      </div>

      <p role="status" className="text-center text-sm">
        {t(statusKey)}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" variant="outline" onClick={handleCancel}>
          {t("faceVerifyCancel")}
        </Button>
        {showFallback ? (
          <Button type="button" onClick={handleFallback}>
            {t("faceVerifyUseCode")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
