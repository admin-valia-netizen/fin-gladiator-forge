import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-neon hover:shadow-neon-strong hover:brightness-110 active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border-2 border-bronze bg-transparent text-bronze-light hover:bg-bronze/10 hover:border-bronze-light",
        secondary:
          "bg-secondary text-secondary-foreground shadow-bronze hover:brightness-110 active:scale-95",
        ghost: 
          "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: 
          "text-primary underline-offset-4 hover:underline",
        // Custom FIN variants
        neon:
          "bg-gradient-neon text-primary-foreground font-bold shadow-neon hover:shadow-neon-strong active:scale-95 uppercase tracking-wider",
        bronze:
          "bg-gradient-bronze text-foreground font-bold shadow-bronze hover:shadow-lg active:scale-95 border border-bronze-light/20",
        gladiator:
          "bg-gradient-neon text-primary-foreground font-bold uppercase tracking-widest shadow-neon-strong animate-pulse-glow hover:scale-105 active:scale-95 transition-transform",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
