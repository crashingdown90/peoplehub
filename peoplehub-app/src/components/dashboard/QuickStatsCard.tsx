// @ai:ag - Quick Stats Card for dashboard overview

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickStatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    trend?: {
        value: number;
        isPositive: boolean;
        label?: string;
    };
}

export function QuickStatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    iconColor = "text-blue-600",
    iconBgColor = "bg-blue-100",
    trend,
}: QuickStatsCardProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600">{title}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                        )}

                        {trend && (
                            <div className="flex items-center gap-1 mt-2">
                                <svg
                                    className={`h-3 w-3 ${trend.isPositive ? "text-green-600" : "text-red-600"
                                        } ${trend.isPositive ? "" : "rotate-180"}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span
                                    className={`text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {Math.abs(trend.value)}%
                                </span>
                                {trend.label && (
                                    <span className="text-xs text-slate-500">{trend.label}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className={`rounded-lg p-3 ${iconBgColor}`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
