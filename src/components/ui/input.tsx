import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-lg border-2 border-[#cbd5e1] bg-input px-3 py-2 text-sm font-medium text-foreground transition-bouncy placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:shadow-[4px_4px_0_0_#8b5cf6] disabled:cursor-not-allowed disabled:opacity-50 md:h-10",
        className,
      )}
      {...props}
    />
  );
}
