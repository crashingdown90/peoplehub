"use client";

// @ai:cx - Page header with breadcrumbs and actions

import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface PageHeaderProps {
    title: string;
    description?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, description, breadcrumbs, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-3 border-b border-slate-200 bg-white/60 px-4 py-4 backdrop-blur", className)}>
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    {breadcrumbs.map((bc, idx) => (
                        <span key={bc.label + idx} className="flex items-center gap-1">
                            {bc.href ? (
                                <Link href={bc.href} className="hover:text-blue-600">
                                    {bc.label}
                                </Link>
                            ) : (
                                <span>{bc.label}</span>
                            )}
                            {idx < breadcrumbs.length - 1 && <span>/</span>}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
                    {description && <p className="text-sm text-slate-600">{description}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
        </div>
    );
}
