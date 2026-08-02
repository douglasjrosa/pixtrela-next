"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { FaceOvalFrame } from "@/components/kiosk/face-oval-frame";
import { Button } from "@/components/ui/button";
import { stopMediaStream } from "@/lib/kiosk/face/verify-face-against-photo";
import { showErrorToast } from "@/lib/ui/app-toast";

export interface FaceOvalCaptureProps {
  onCapture: (file: File) => void | Promise<void>;
  onCancel: () => void;
  disabled?: boolean;
}

function canvasToJpegFile(canvas: HTMLCanvasElement): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("capture_failed"));
          return;
        }
        resolve(new File([blob], "face-capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}

/** Live camera capture with oval guide for face enrollment. */
export function FaceOvalCapture({
  onCapture,
  onCancel,
  disabled = false,
}: FaceOvalCaptureProps) {
  const t = useTranslations("kiosk");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera(): Promise<void> {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
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
        setReady(true);
      } catch {
        if (!cancelled) {
          showErrorToast(t("faceCaptureCameraFailed"));
          onCancel();
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
    // Start camera once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCapture(): Promise<void> {
    const video = videoRef.current;
    if (!video || !ready || capturing || disabled) return;

    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const context = canvas.getContext("2d");
      if (!context) {
        showErrorToast(t("faceCaptureFailed"));
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const file = await canvasToJpegFile(canvas);
      stopMediaStream(streamRef.current);
      streamRef.current = null;
      await onCapture(file);
    } catch {
      showErrorToast(t("faceCaptureFailed"));
    } finally {
      setCapturing(false);
    }
  }

  function handleCancel(): void {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    onCancel();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
      <p className="text-center text-sm text-muted-foreground">
        {t("faceCaptureHint")}
      </p>
      <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="size-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <FaceOvalFrame />
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled || capturing}
          onClick={handleCancel}
        >
          {t("faceCaptureCancel")}
        </Button>
        <Button
          type="button"
          disabled={disabled || !ready || capturing}
          onClick={() => void handleCapture()}
        >
          {t("faceCaptureTake")}
        </Button>
      </div>
    </div>
  );
}
