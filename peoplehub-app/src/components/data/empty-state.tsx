"use client";

// @ai:cx - Empty state placeholder

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-center", className)}>
            {icon && <div className="mb-1 text-slate-500">{icon}</div>}
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description && <p className="max-w-md text-sm text-slate-600">{description}</p>}
            {action && (
                <Button onClick={action.onClick} className="mt-2">
                    {action.label}
                </Button>
            )}
        </div>
    );
}
