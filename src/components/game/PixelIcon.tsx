import { cn } from "@/lib/utils";

type Props = {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
};

export function PixelIcon({ name, size = 20, className, alt = "" }: Props) {
  const px = Math.round(size);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny pixel icons must stay unoptimized
    <img
      src={`/ui/icons/${name}.png`}
      alt={alt}
      width={px}
      height={px}
      className={cn("pixelated shrink-0", className)}
      style={{ width: px, height: px }}
      draggable={false}
    />
  );
}
