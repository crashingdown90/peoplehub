"use client";

// @ai:cx - Form section grouping

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
    return (
        <section className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>
            <div className="mb-3">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                {description && <p className="text-sm text-slate-600">{description}</p>}
            </div>
            <div className="grid gap-3 md:grid-cols-2">{children}</div>
        </section>
    );
}
