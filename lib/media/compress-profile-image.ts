export const PROFILE_IMAGE_MAX_EDGE_PX = 512;
export const PROFILE_IMAGE_JPEG_QUALITY = 0.82;

export function buildProfileImageFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, "") || "avatar";
  return `${base}.jpg`;
}

export async function compressProfileImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("invalidType");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(
    1,
    PROFILE_IMAGE_MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvasUnavailable");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("compressFailed"));
          return;
        }
        resolve(result);
      },
      "image/jpeg",
      PROFILE_IMAGE_JPEG_QUALITY,
    );
  });

  return new File([blob], buildProfileImageFileName(file.name), {
    type: "image/jpeg",
  });
}
