"use client";

// @ai:cx - Chart container card

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function ChartCard({ title, description, children, actions, className }: ChartCardProps) {
    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
            <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                    {description && <p className="text-sm text-slate-500">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
            <div className="h-full w-full">{children}</div>
        </div>
    );
}
