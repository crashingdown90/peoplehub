"use client";

// @ai:cx - Loading state helper

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
    message?: string;
    className?: string;
    fullHeight?: boolean;
}

export function LoadingState({ message = "Memuat...", className, fullHeight }: LoadingStateProps) {
    return (
        <div className={cn("flex items-center justify-center gap-2 text-[var(--color-text-subtle)]", fullHeight ? "min-h-[200px]" : "py-6", className)}>
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent)]" />
            <span className="text-sm font-medium">{message}</span>
        </div>
    );
}
