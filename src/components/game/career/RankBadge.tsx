export function RankBadge({ rankId, size = 48 }: { rankId: string; size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 24px badges scale by an integer only
    <img
      src={`/ui/icons/badge_${rankId}.png`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="pixelated size-auto max-w-none shrink-0"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
