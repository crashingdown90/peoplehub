"use client";

// @ai:cx - Skeleton loading placeholder

import { cn } from "@/lib/utils";

type SkeletonVariant = "text" | "circle" | "rect";

interface SkeletonProps {
    variant?: SkeletonVariant;
    width?: string | number;
    height?: string | number;
    className?: string;
}

export function Skeleton({ variant = "text", width, height, className }: SkeletonProps) {
    const style: Record<SkeletonVariant, string> = {
        text: "h-4 w-full rounded",
        circle: "rounded-full",
        rect: "rounded-md",
    };

    return (
        <div
            className={cn(
                "animate-pulse bg-slate-200",
                style[variant],
                className
            )}
            style={{ width, height }}
        />
    );
}
