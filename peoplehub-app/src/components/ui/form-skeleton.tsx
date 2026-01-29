"use client";

// @ai:cx - Form skeleton loading states

import { cn } from "@/lib/utils";

export interface FormSkeletonProps {
    fields?: number;
    showButtons?: boolean;
    columns?: 1 | 2;
    className?: string;
}

export function FormSkeleton({
    fields = 4,
    showButtons = true,
    columns = 1,
    className
}: FormSkeletonProps) {
    return (
        <div className={cn("space-y-6 animate-pulse", className)}>
            {/* Form fields */}
            <div className={cn(
                "grid gap-4",
                columns === 2 ? "md:grid-cols-2" : "grid-cols-1"
            )}>
                {Array.from({ length: fields }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        {/* Label */}
                        <div className="h-4 w-24 rounded bg-slate-200" />

                        {/* Input field */}
                        <div className="h-10 w-full rounded-md border border-slate-200 bg-slate-100" />
                    </div>
                ))}
            </div>

            {/* Button group */}
            {showButtons && (
                <div className="flex justify-end gap-3">
                    <div className="h-10 w-24 rounded-md bg-slate-200" />
                    <div className="h-10 w-24 rounded-md bg-slate-300" />
                </div>
            )}
        </div>
    );
}

export interface FieldSkeletonProps {
    className?: string;
}

export function FieldSkeleton({ className }: FieldSkeletonProps) {
    return (
        <div className={cn("space-y-2 animate-pulse", className)}>
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-md border border-slate-200 bg-slate-100" />
        </div>
    );
}

export interface SelectSkeletonProps {
    className?: string;
}

export function SelectSkeleton({ className }: SelectSkeletonProps) {
    return (
        <div className={cn("space-y-2 animate-pulse", className)}>
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-md border border-slate-200 bg-slate-100">
                <div className="flex h-full items-center justify-between px-3">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-4 w-4 rounded bg-slate-200" />
                </div>
            </div>
        </div>
    );
}

export interface TextareaSkeletonProps {
    rows?: number;
    className?: string;
}

export function TextareaSkeleton({ rows = 4, className }: TextareaSkeletonProps) {
    return (
        <div className={cn("space-y-2 animate-pulse", className)}>
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div
                className="w-full rounded-md border border-slate-200 bg-slate-100"
                style={{ height: `${rows * 24 + 16}px` }}
            />
        </div>
    );
}

FormSkeleton.displayName = "FormSkeleton";
FieldSkeleton.displayName = "FieldSkeleton";
SelectSkeleton.displayName = "SelectSkeleton";
TextareaSkeleton.displayName = "TextareaSkeleton";
