import { cn } from "@/lib/utils";
import { resolveIconAsset, type IconName } from "@/lib/pixel-assets";

type Props = {
  name: IconName | string;
  size?: number;
  className?: string;
  alt?: string;
};

export function PixelIcon({ name, size = 22, className, alt = "" }: Props) {
  const { src, displayPx } = resolveIconAsset(name, size);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pixel icons stay unoptimized
    <img
      src={src}
      alt={alt}
      width={displayPx}
      height={displayPx}
      className={cn(
        "pixelated size-auto max-w-none shrink-0",
        className,
      )}
      style={{
        width: displayPx,
        height: displayPx,
        minWidth: displayPx,
        minHeight: displayPx,
      }}
      draggable={false}
    />
  );
}
