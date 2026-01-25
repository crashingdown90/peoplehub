"use client";

// @ai:cx - Form field wrapper

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    description?: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
}

export function FormField({ label, htmlFor, error, description, required, children, className }: FormFieldProps) {
    return (
        <div className={cn("space-y-1", className)}>
            <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {description && <p className="text-xs text-slate-500">{description}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
