import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PanelCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-[var(--shadow-panel)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelCardTitle({
  className,
  children,
  icon,
}: {
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={cn("flex items-center gap-2 font-galmuri-11 text-galmuri-title", className)}>
      {icon}
      <h2 className="font-normal text-[var(--foreground)]">{children}</h2>
    </div>
  );
}
