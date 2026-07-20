import {
  faceDescriptorDistance,
  isFaceMatch,
} from "./face-descriptor-distance";
import { detectSingleFaceDescriptor } from "./detect-single-descriptor";
import {
  FACE_VERIFY_FRAME_COUNT,
  FACE_VERIFY_MIN_MATCHING_FRAMES,
  FACE_VERIFY_THROTTLE_MS,
  FACE_VERIFY_TIMEOUT_MS,
} from "./face-match-constants";

export type FaceVerifyStatus =
  | "matching"
  | "no_face"
  | "multiple_faces"
  | "too_small"
  | "mismatch"
  | "success"
  | "timeout"
  | "aborted";

export type FaceVerifyResult = {
  status: FaceVerifyStatus;
  matchingFrames: number;
  sampledFrames: number;
  bestDistance: number;
};

const DETECT_TIMEOUT = Symbol("detect_timeout");

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function detectWithDeadline(
  video: HTMLVideoElement,
  remainingMs: number,
): Promise<Awaited<ReturnType<typeof detectSingleFaceDescriptor>> | typeof DETECT_TIMEOUT> {
  if (remainingMs <= 0) return DETECT_TIMEOUT;

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      detectSingleFaceDescriptor(video),
      new Promise<typeof DETECT_TIMEOUT>((resolve) => {
        timer = setTimeout(() => resolve(DETECT_TIMEOUT), remainingMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export type VerifyFaceOptions = {
  video: HTMLVideoElement;
  referenceDescriptor: Float32Array | number[];
  signal?: AbortSignal;
  frameCount?: number;
  minMatchingFrames?: number;
  throttleMs?: number;
  timeoutMs?: number;
  onStatus?: (status: FaceVerifyStatus) => void;
};

/**
 * Samples multiple video frames and accepts when enough match the reference.
 * Does not persist frames or descriptors.
 */
export async function verifyFaceAgainstPhoto(
  options: VerifyFaceOptions,
): Promise<FaceVerifyResult> {
  const {
    video,
    referenceDescriptor,
    signal,
    frameCount = FACE_VERIFY_FRAME_COUNT,
    minMatchingFrames = FACE_VERIFY_MIN_MATCHING_FRAMES,
    throttleMs = FACE_VERIFY_THROTTLE_MS,
    timeoutMs = FACE_VERIFY_TIMEOUT_MS,
    onStatus,
  } = options;

  const startedAt = Date.now();
  let matchingFrames = 0;
  let sampledFrames = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  let lastStatus: FaceVerifyStatus = "matching";

  const report = (status: FaceVerifyStatus): void => {
    lastStatus = status;
    onStatus?.(status);
  };

  const timedOutResult = (): FaceVerifyResult => {
    report("timeout");
    return {
      status: "timeout",
      matchingFrames,
      sampledFrames,
      bestDistance,
    };
  };

  report("matching");

  while (sampledFrames < frameCount) {
    if (signal?.aborted) {
      return {
        status: "aborted",
        matchingFrames,
        sampledFrames,
        bestDistance,
      };
    }

    const remainingMs = timeoutMs - (Date.now() - startedAt);
    if (remainingMs <= 0) {
      return timedOutResult();
    }

    const detection = await detectWithDeadline(video, remainingMs);
    if (detection === DETECT_TIMEOUT) {
      return timedOutResult();
    }

    sampledFrames += 1;

    if (detection.ok === false) {
      report(detection.reason);
    } else {
      const distance = faceDescriptorDistance(
        referenceDescriptor,
        detection.descriptor,
      );
      if (distance < bestDistance) bestDistance = distance;

      if (isFaceMatch(distance)) {
        matchingFrames += 1;
        if (matchingFrames >= minMatchingFrames) {
          report("success");
          return {
            status: "success",
            matchingFrames,
            sampledFrames,
            bestDistance,
          };
        }
        report("matching");
      } else {
        report("mismatch");
      }
    }

    await sleep(throttleMs);
  }

  const status: FaceVerifyStatus =
    matchingFrames >= minMatchingFrames
      ? "success"
      : lastStatus === "matching"
        ? "mismatch"
        : lastStatus;

  if (status === "success") report("success");

  return {
    status: matchingFrames >= minMatchingFrames ? "success" : status,
    matchingFrames,
    sampledFrames,
    bestDistance,
  };
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    track.stop();
  }
}
