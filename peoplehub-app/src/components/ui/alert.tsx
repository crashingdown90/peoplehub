"use client";

// @ai:cx - Alert component with variants

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

type AlertVariant = "success" | "warning" | "error" | "info";

const tone: Record<AlertVariant, { icon: ReactNode; className: string; titleClass: string; textClass: string }> = {
    success: {
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        className: "border-green-200 bg-green-50",
        titleClass: "text-green-800",
        textClass: "text-green-700",
    },
    warning: {
        icon: <TriangleAlert className="h-5 w-5 text-orange-600" />,
        className: "border-orange-200 bg-orange-50",
        titleClass: "text-orange-800",
        textClass: "text-orange-700",
    },
    error: {
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        className: "border-red-200 bg-red-50",
        titleClass: "text-red-800",
        textClass: "text-red-700",
    },
    info: {
        icon: <Info className="h-5 w-5 text-blue-600" />,
        className: "border-blue-200 bg-blue-50",
        titleClass: "text-blue-800",
        textClass: "text-blue-700",
    },
};

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children?: ReactNode;
    className?: string;
}

export function Alert({ variant = "info", title, children, className }: AlertProps) {
    const t = tone[variant];
    return (
        <div className={cn("flex gap-3 rounded-lg border px-3 py-2", t.className, className)} role="alert">
            <div className="mt-0.5">{t.icon}</div>
            <div className="space-y-1">
                {title && <p className={cn("text-sm font-semibold", t.titleClass)}>{title}</p>}
                {children && <p className={cn("text-sm", t.textClass)}>{children}</p>}
            </div>
        </div>
    );
}
