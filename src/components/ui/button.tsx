import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ArrowRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-bouncy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 min-h-12 md:min-h-9",
  {
    variants: {
      variant: {
        default:
          "btn-candy bg-accent text-accent-foreground px-5 group",
        secondary:
          "btn-secondary-ui bg-transparent text-foreground px-5 hover:text-foreground",
        outline:
          "btn-secondary-ui bg-transparent text-foreground px-5 hover:text-foreground",
        ghost:
          "rounded-full border-2 border-transparent text-foreground hover:bg-muted",
      },
      size: {
        default: "h-12 px-5 py-2 md:h-10",
        sm: "h-12 px-4 text-xs md:h-9",
        icon: "h-12 w-12 md:h-10 md:w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  showArrow?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  showArrow,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const withArrow =
    showArrow ?? (variant === "default" || variant === undefined);

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      {withArrow && !asChild && (variant === "default" || !variant) && (
        <span
          className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-foreground"
          aria-hidden
        >
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" strokeWidth={2.5} />
        </span>
      )}
    </Comp>
  );
}
