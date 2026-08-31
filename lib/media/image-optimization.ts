const LOCAL_OPTIMIZED_MEDIA_PREFIXES = [
  "/api/media/",
  "/api/kiosk/face-media",
] as const;

/** True when Next should skip its optimizer (remote CDN, blob previews, etc.). */
export function shouldUseUnoptimizedImage(src: string): boolean {
  if (src.startsWith("blob:")) return true;

  return !LOCAL_OPTIMIZED_MEDIA_PREFIXES.some((prefix) =>
    src.startsWith(prefix),
  );
}
