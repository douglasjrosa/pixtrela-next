import type * as FaceApi from "@vladmandic/face-api";

import { assessFaceFrameQuality } from "./face-frame-quality";
import {
  createTinyFaceDetectorOptions,
  loadFaceModels,
} from "./load-face-models";

export type DetectDescriptorResult =
  | {
      ok: true;
      descriptor: Float32Array;
      box: { width: number; height: number };
    }
  | {
      ok: false;
      reason: "no_face" | "multiple_faces" | "too_small";
    };

type FaceInput =
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement;

async function detectAllWithDescriptor(
  faceApi: typeof FaceApi,
  input: FaceInput,
) {
  const options = createTinyFaceDetectorOptions(faceApi);
  return faceApi
    .detectAllFaces(input, options)
    .withFaceLandmarks(true)
    .withFaceDescriptors();
}

export async function detectSingleFaceDescriptor(
  input: FaceInput,
): Promise<DetectDescriptorResult> {
  const faceApi = await loadFaceModels();
  const detections = await detectAllWithDescriptor(faceApi, input);
  const quality = assessFaceFrameQuality(
    detections.length,
    detections[0]
      ? {
          width: detections[0].detection.box.width,
          height: detections[0].detection.box.height,
        }
      : null,
  );

  if (quality.ok === false) {
    return { ok: false, reason: quality.reason };
  }

  const first = detections[0]!;
  return {
    ok: true,
    descriptor: first.descriptor,
    box: {
      width: first.detection.box.width,
      height: first.detection.box.height,
    },
  };
}

/**
 * Count faces in an image (enrollment validation). Does not require landmarks
 * when only counting — uses detector + landmarks for consistency with match.
 */
export async function countFacesInImage(
  input: HTMLImageElement | HTMLCanvasElement,
): Promise<number> {
  const faceApi = await loadFaceModels();
  const options = createTinyFaceDetectorOptions(faceApi);
  const detections = await faceApi.detectAllFaces(input, options);
  return detections.length;
}
