import { countFacesInImage } from "@/lib/kiosk/face/detect-single-descriptor";
import { loadFaceModels } from "@/lib/kiosk/face/load-face-models";

export type FacePhotoValidation =
  | { ok: true }
  | { ok: false; reason: "no_face" | "multiple_faces" | "load_failed" };

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
 * Ensures the enrollment photo has exactly one detectable face before upload.
 */
export async function validateFacePhotoHasSingleFace(
  file: File,
): Promise<FacePhotoValidation> {
  try {
    await loadFaceModels();
    const image = await loadImageFromFile(file);
    const count = await countFacesInImage(image);
    if (count <= 0) return { ok: false, reason: "no_face" };
    if (count > 1) return { ok: false, reason: "multiple_faces" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "load_failed" };
  }
}
