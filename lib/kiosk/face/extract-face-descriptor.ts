import { detectSingleFaceDescriptor } from "./detect-single-descriptor";
import { FACE_DESCRIPTOR_LENGTH } from "./face-match-constants";
import { loadFaceModels } from "./load-face-models";

export type ExtractFaceDescriptorResult =
  | { ok: true; faceVector: number[] }
  | {
      ok: false;
      reason: "no_face" | "multiple_faces" | "too_small" | "load_failed";
    };

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load_failed"));
    };
    image.src = url;
  });
}

/**
 * Extracts a face-api descriptor (length 128) from an enrollment image file.
 */
export async function extractFaceDescriptorFromFile(
  file: File,
): Promise<ExtractFaceDescriptorResult> {
  try {
    await loadFaceModels();
    const image = await loadImageFromFile(file);
    const detection = await detectSingleFaceDescriptor(image);
    if (detection.ok === false) {
      return { ok: false, reason: detection.reason };
    }

    const faceVector = Array.from(detection.descriptor);
    if (faceVector.length !== FACE_DESCRIPTOR_LENGTH) {
      return { ok: false, reason: "load_failed" };
    }

    return { ok: true, faceVector };
  } catch {
    return { ok: false, reason: "load_failed" };
  }
}
