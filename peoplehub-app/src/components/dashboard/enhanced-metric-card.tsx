"use client";

// Enhanced Metric Card with trends and better visual hierarchy

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: LucideIcon;
    trend?: {
        value: number; // percentage
        label: string; // e.g., "vs bulan lalu"
        isPositive?: boolean; // if undefined, will determine from value
    };
    action?: {
        label: string;
        href: string;
    };
    variant?: "default" | "success" | "warning" | "danger" | "info";
    className?: string;
}

const variantStyles = {
    default: {
        icon: "text-muted-foreground",
        value: "text-foreground",
    },
    success: {
        icon: "text-green-600",
        value: "text-green-600",
    },
    warning: {
        icon: "text-orange-500",
        value: "text-orange-600",
    },
    danger: {
        icon: "text-red-600",
        value: "text-red-600",
    },
    info: {
        icon: "text-blue-600",
        value: "text-blue-600",
    },
};

export function EnhancedMetricCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    action,
    variant = "default",
    className,
}: MetricCardProps) {
    const styles = variantStyles[variant];

    // Determine trend direction if not explicitly set
    const isTrendPositive = trend?.isPositive ?? (trend ? trend.value > 0 : undefined);

    const TrendIcon = trend
        ? trend.value > 0
            ? TrendingUp
            : trend.value < 0
                ? TrendingDown
                : Minus
        : null;

    return (
        <Card className={cn("", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && <Icon className={cn("h-4 w-4", styles.icon)} />}
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", styles.value)}>{value}</div>

                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}

                {trend && (
                    <div className="flex items-center gap-2 mt-2">
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs gap-1",
                                isTrendPositive
                                    ? "text-green-600 border-green-600 bg-green-50"
                                    : trend.value < 0
                                        ? "text-red-600 border-red-600 bg-red-50"
                                        : "text-gray-600 border-gray-600 bg-gray-50"
                            )}
                        >
                            {TrendIcon && <TrendIcon className="h-3 w-3" />}
                            {Math.abs(trend.value)}% {trend.label}
                        </Badge>
                    </div>
                )}

                {action && (
                    <div className="mt-3">
                        <Link href={action.href}>
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                {action.label} →
                            </Button>
                        </Link>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

EnhancedMetricCard.displayName = "EnhancedMetricCard";
