import type * as FaceApi from "@vladmandic/face-api";

import {
  FACE_API_MODELS_URL,
  FACE_DETECTOR_INPUT_SIZE,
} from "./face-match-constants";

let modelsReady: Promise<typeof FaceApi> | null = null;

export function createTinyFaceDetectorOptions(
  faceApi: typeof FaceApi,
  inputSize: number = FACE_DETECTOR_INPUT_SIZE,
): FaceApi.TinyFaceDetectorOptions {
  return new faceApi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold: 0.5,
  });
}

/**
 * Loads face-api models once (in-memory cache). Safe to call from the home
 * screen to warm models before verification.
 */
export async function loadFaceModels(
  modelsUrl: string = FACE_API_MODELS_URL,
): Promise<typeof FaceApi> {
  if (typeof window === "undefined") {
    throw new Error("Face models can only load in the browser");
  }

  if (!modelsReady) {
    modelsReady = (async () => {
      const faceApi = await import("@vladmandic/face-api");
      await Promise.all([
        faceApi.nets.tinyFaceDetector.loadFromUri(modelsUrl),
        faceApi.nets.faceLandmark68TinyNet.loadFromUri(modelsUrl),
        faceApi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
      ]);
      return faceApi;
    })();
  }

  return modelsReady;
}

/** Test helper: reset the in-memory model cache. */
export function resetFaceModelsCacheForTests(): void {
  modelsReady = null;
}
