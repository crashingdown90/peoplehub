"use client";

// @ai:cx - Stats card with trend indicator

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon?: ReactNode;
    trend?: {
        value: number;
        direction: "up" | "down" | "neutral";
    };
    description?: string;
    loading?: boolean;
}

export function StatsCard({ title, value, icon, trend, description, loading }: StatsCardProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-slate-500">{title}</div>
                {icon && <div className="text-slate-500">{icon}</div>}
            </div>

            <div className="mt-3 flex items-end justify-between">
                <div>
                    {loading ? (
                        <Skeleton variant="text" width="120px" height="28px" />
                    ) : (
                        <div className="text-2xl font-semibold text-slate-900">{value}</div>
                    )}
                    {description && <p className="text-sm text-slate-500">{description}</p>}
                </div>
                {trend && !loading && <TrendPill trend={trend} />}
                {loading && <Skeleton variant="rect" width="80px" height="24px" />}
            </div>
        </div>
    );
}

function TrendPill({ trend }: { trend: NonNullable<StatsCardProps["trend"]> }) {
    const tone =
        trend.direction === "up"
            ? "bg-green-50 text-green-700 border border-green-200"
            : trend.direction === "down"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-slate-50 text-slate-700 border border-slate-200";

    const Icon =
        trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;

    return (
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold", tone)}>
            <Icon className="h-4 w-4" />
            {trend.value}%
        </span>
    );
}
