// @ai:ag - Quick Actions Menu for dashboard

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface QuickAction {
    id: string;
    label: string;
    icon: LucideIcon;
    href: string;
    description?: string;
    color?: string;
    bgColor?: string;
    badge?: string | number;
}

interface QuickActionsMenuProps {
    actions: QuickAction[];
    title?: string;
}

export function QuickActionsMenu({
    actions,
    title = "Aksi Cepat",
}: QuickActionsMenuProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        const color = action.color || "text-blue-600";
                        const bgColor = action.bgColor || "bg-blue-50";

                        return (
                            <Link
                                key={action.id}
                                href={action.href}
                                className="group relative p-4 border rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                            >
                                {/* Badge */}
                                {action.badge && (
                                    <div className="absolute top-2 right-2">
                                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                                            {action.badge}
                                        </span>
                                    </div>
                                )}

                                <div className="flex flex-col items-center text-center gap-2">
                                    <div
                                        className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
                                    >
                                        <Icon className={`h-6 w-6 ${color}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {action.label}
                                        </p>
                                        {action.description && (
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {action.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
