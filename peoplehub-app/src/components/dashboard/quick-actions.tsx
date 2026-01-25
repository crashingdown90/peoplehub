"use client";

// @ai:cx - Quick action tiles

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QuickAction {
    label: string;
    href: string;
    icon: ReactNode;
    description?: string;
}

interface QuickActionsProps {
    actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
    return (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action) => (
                <Link
                    key={action.label}
                    href={action.href}
                    className="group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow"
                >
                    <div className="flex items-center gap-2 text-blue-600">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50")}>
                            {action.icon}
                        </div>
                        <span className="font-semibold text-slate-900">{action.label}</span>
                    </div>
                    {action.description && <p className="text-sm text-slate-600">{action.description}</p>}
                </Link>
            ))}
        </div>
    );
}
