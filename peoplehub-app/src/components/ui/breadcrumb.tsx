"use client";

// @ai:cx - Breadcrumb navigation component

import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ReactNode;
}

export interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
    separator?: React.ReactNode;
    showHome?: boolean;
}

export function Breadcrumb({
    items,
    className,
    separator = <ChevronRight className="h-4 w-4" />,
    showHome = true
}: BreadcrumbProps) {
    // Prepend home item if enabled
    const allItems: BreadcrumbItem[] = showHome
        ? [{ label: "Home", href: "/dashboard", icon: <Home className="h-4 w-4" /> }, ...items]
        : items;

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("flex items-center space-x-1 text-sm", className)}
        >
            <ol className="flex items-center space-x-1">
                {allItems.map((item, index) => {
                    const isLast = index === allItems.length - 1;

                    return (
                        <li key={index} className="flex items-center space-x-1">
                            {index > 0 && (
                                <span className="text-[var(--color-text-subtle)]" aria-hidden="true">
                                    {separator}
                                </span>
                            )}

                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-1.5 text-[var(--color-text-subtle)]",
                                        "hover:text-[var(--color-text)] transition-colors"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            ) : (
                                <span
                                    className={cn(
                                        "flex items-center gap-1.5",
                                        isLast
                                            ? "text-[var(--color-text)] font-medium"
                                            : "text-[var(--color-text-subtle)]"
                                    )}
                                    aria-current={isLast ? "page" : undefined}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

Breadcrumb.displayName = "Breadcrumb";
