import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "accent" | "secondary" | "tertiary" | "quaternary" | "muted";

const toneBg: Record<Tone, string> = {
  accent: "bg-accent text-accent-foreground",
  secondary: "bg-secondary text-foreground",
  tertiary: "bg-tertiary text-foreground",
  quaternary: "bg-quaternary text-foreground",
  muted: "bg-muted text-foreground",
};

export function IconBadge({
  children,
  tone = "accent",
  className,
  floating,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  floating?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-foreground [&_svg]:stroke-[2.5]",
        toneBg[tone],
        floating && "-translate-y-1/2 border-foreground shadow-pop",
        className,
      )}
    >
      {children}
    </span>
  );
}
