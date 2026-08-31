import { AppImage } from "@/components/media/app-image";

export type OptimizedMediaImageProps = {
  src: string;
  width: number;
  height: number;
  className?: string;
};

/** @deprecated Use isLocallyOptimizedMediaSrc from image-optimization in new code. */
export function isLocallyOptimizedMediaSrc(src: string): boolean {
  return src.startsWith("/api/media/");
}

export function OptimizedMediaImage({
  src,
  width,
  height,
  className,
}: OptimizedMediaImageProps) {
  return (
    <AppImage
      src={src}
      width={width}
      height={height}
      className={className}
      aria-hidden
    />
  );
}
