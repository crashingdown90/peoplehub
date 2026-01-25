import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] focus-visible:ring-[var(--color-accent)]",
        secondary: "bg-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-border)]/80 focus-visible:ring-[var(--color-border)]",
        outline: "border border-[var(--color-border)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-border)] focus-visible:ring-[var(--color-border)]",
        ghost: "text-[var(--color-text)] hover:bg-[var(--color-border)] focus-visible:ring-[var(--color-border)]",
        destructive: "bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/90 focus-visible:ring-[var(--color-error)]",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 min-h-[44px] px-4 py-2",
        sm: "h-9 min-h-[44px] px-3 text-sm",
        lg: "h-12 min-h-[48px] px-6 text-lg",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
