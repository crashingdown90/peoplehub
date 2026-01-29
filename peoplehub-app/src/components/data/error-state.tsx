"use client";

// @ai:cx - Error state with retry

import { ReactNode } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    icon?: ReactNode;
    className?: string;
}

export function ErrorState({ title = "Terjadi kesalahan", message, onRetry, icon, className }: ErrorStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center", className)}>
            <div className="text-red-600">
                {icon || <AlertTriangle className="h-6 w-6" />}
            </div>
            <h3 className="text-lg font-semibold text-red-800">{title}</h3>
            {message && <p className="max-w-md text-sm text-red-700">{message}</p>}
            {onRetry && (
                <Button variant="outline" onClick={onRetry} className="border-red-200 text-red-700 hover:bg-red-100">
                    Coba lagi
                </Button>
            )}
        </div>
    );
}
