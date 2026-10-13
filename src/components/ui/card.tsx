import * as React from "react";
import { cn } from "@/lib/utils";

export function StickerCard({
  className,
  featured,
  children,
  ...props
}: React.ComponentProps<"div"> & { featured?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-foreground bg-card p-4 transition-bouncy motion-safe-hover-tilt hover:-rotate-1 hover:scale-[1.02]",
        featured ? "shadow-card-featured" : "shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StickerCardHeader({
  className,
  icon,
  title,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode;
  title: string;
}) {
  return (
    <div
      className={cn("mb-3 flex items-end gap-3 pl-1", icon && "pt-5", className)}
      {...props}
    >
      {icon ? <div className="relative shrink-0">{icon}</div> : null}
      <h2 className="font-heading text-lg font-extrabold text-foreground">
        {title}
      </h2>
    </div>
  );
}
