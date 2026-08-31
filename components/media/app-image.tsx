import Image from "next/image";
import type { CSSProperties } from "react";

import { shouldUseUnoptimizedImage } from "@/lib/media/image-optimization";
import { cn } from "@/lib/utils";

type BaseAppImageProps = {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  crossOrigin?: "anonymous" | "use-credentials";
  sizes?: string;
  priority?: boolean;
  "data-testid"?: string;
};

type FillAppImageProps = BaseAppImageProps & {
  fill: true;
  width?: never;
  height?: never;
};

type SizedAppImageProps = BaseAppImageProps & {
  fill?: false;
  width: number;
  height: number;
};

export type AppImageProps = FillAppImageProps | SizedAppImageProps;

export function AppImage({
  src,
  alt = "",
  className,
  style,
  crossOrigin,
  sizes,
  priority,
  "data-testid": dataTestId,
  ...sizeProps
}: AppImageProps) {
  const unoptimized = shouldUseUnoptimizedImage(src);

  if (sizeProps.fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        crossOrigin={crossOrigin}
        style={style}
        data-testid={dataTestId}
        className={cn(className)}
        unoptimized={unoptimized}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={sizeProps.width}
      height={sizeProps.height}
      priority={priority}
      crossOrigin={crossOrigin}
      style={style}
      data-testid={dataTestId}
      className={cn(className)}
      unoptimized={unoptimized}
    />
  );
}
