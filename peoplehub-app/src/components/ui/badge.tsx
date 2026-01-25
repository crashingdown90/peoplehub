"use client";

// @ai:cx - Status badge component

import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "default" | "secondary" | "destructive" | "outline";

const variantClass: Record<BadgeVariant, string> = {
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-orange-50 text-orange-700 border border-orange-200",
    error: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
    neutral: "bg-slate-50 text-slate-700 border border-slate-200",
    // shadcn-style variants
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border border-input bg-background text-foreground",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = "neutral", ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                    variantClass[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = "Badge";

export { Badge };
