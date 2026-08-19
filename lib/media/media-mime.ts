/** File extension from mime type and optional original filename. */
export function extensionFromMime(
  mimeType: string,
  originalFilename?: string | null,
): string {
  const fromName = originalFilename?.split(".").pop()?.trim().toLowerCase();
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) {
    return fromName;
  }
  const mime = mimeType.toLowerCase();
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  if (mime.includes("svg")) return "svg";
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  return "bin";
}

export function isAllowedLibraryMime(mimeType: string): boolean {
  const mime = mimeType.toLowerCase();
  return mime.startsWith("image/") || mime === "application/pdf";
}

export function isImageMime(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.toLowerCase().startsWith("image/"));
}
