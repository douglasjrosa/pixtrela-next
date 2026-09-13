const LOCAL_OPTIMIZED_MEDIA_PREFIXES = [
  "/api/media/",
  "/api/kiosk/face-media",
] as const;

const SVG_PATH_PATTERN = /\.svg(?:$|[?#])/i;

/** True when the URL points at an SVG asset. */
export function isSvgImageSrc(src: string): boolean {
  const path = src.split("?")[0]?.split("#")[0] ?? src;
  return SVG_PATH_PATTERN.test(path);
}

/** True when Next should skip its optimizer (remote CDN, blob previews, SVG). */
export function shouldUseUnoptimizedImage(src: string): boolean {
  if (src.startsWith("blob:")) return true;
  if (isSvgImageSrc(src)) return true;

  return !LOCAL_OPTIMIZED_MEDIA_PREFIXES.some((prefix) =>
    src.startsWith(prefix),
  );
}
