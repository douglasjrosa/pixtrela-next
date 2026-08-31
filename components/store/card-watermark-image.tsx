import { AppImage } from "@/components/media/app-image";
import {
  STORE_CARD_WATERMARK_IMAGE_CLASS,
  STORE_CARD_WATERMARK_SLOT_CLASS,
} from "@/lib/store/store-layout";

export type CardWatermarkImageProps = {
  src: string;
  widthPercent: number;
  opacity: number;
  testId?: string;
};

export function CardWatermarkImage({
  src,
  widthPercent,
  opacity,
  testId,
}: CardWatermarkImageProps) {
  return (
    <div className={STORE_CARD_WATERMARK_SLOT_CLASS}>
      <AppImage
        src={src}
        width={160}
        height={160}
        data-testid={testId}
        className={STORE_CARD_WATERMARK_IMAGE_CLASS}
        style={{
          maxWidth: `${widthPercent}%`,
          opacity: opacity / 100,
        }}
      />
    </div>
  );
}
