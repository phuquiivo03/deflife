import { cn } from "@/lib/utils";
import {
  resolveAvatarAsset,
  type FramedAvatarRole,
} from "@/lib/pixel-assets";

type Props = {
  role: FramedAvatarRole;
  size?: number;
  className?: string;
  alt?: string;
};

/** Framed 48×48 portrait (not bust). */
export function PixelAvatar({ role, size = 48, className, alt = "" }: Props) {
  const { src, displayPx } = resolveAvatarAsset(role, size);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pixel avatars stay unoptimized
    <img
      src={src}
      alt={alt}
      width={displayPx}
      height={displayPx}
      className={cn("pixelated size-auto max-w-none shrink-0 object-cover", className)}
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
