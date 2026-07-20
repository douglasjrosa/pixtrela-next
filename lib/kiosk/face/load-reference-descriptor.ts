import { detectSingleFaceDescriptor } from "./detect-single-descriptor";
import { toKioskFaceMediaProxyUrl } from "./face-media-proxy-url";
import { loadFaceModels } from "./load-face-models";

export async function loadReferenceFaceDescriptor(
  photoUrl: string,
): Promise<Float32Array> {
  await loadFaceModels();

  const sameOriginUrl = photoUrl.startsWith("/")
    ? photoUrl
    : toKioskFaceMediaProxyUrl(photoUrl);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("reference_load_failed"));
    img.src = sameOriginUrl;
  });

  const detection = await detectSingleFaceDescriptor(image);
  if (detection.ok === false) {
    throw new Error(`reference_${detection.reason}`);
  }

  return detection.descriptor;
}
