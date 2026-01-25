"use client";

// @ai:cx - Recent activity feed widget

import { cn } from "@/lib/utils";
import { Activity, Clock, FileText, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface ActivityItem {
    id: string;
    type: "attendance" | "leave" | "overtime" | "reimbursement" | "payslip";
    title: string;
    description?: string;
    timestamp: Date;
    status?: "success" | "pending" | "rejected";
}

export interface RecentActivityWidgetProps {
    activities: ActivityItem[];
    className?: string;
}

const typeIcons = {
    attendance: Clock,
    leave: Calendar,
    overtime: Clock,
    reimbursement: DollarSign,
    payslip: FileText,
};

const statusColors = {
    success: "text-green-600",
    pending: "text-yellow-600",
    rejected: "text-red-600",
};

export function RecentActivityWidget({ activities, className }: RecentActivityWidgetProps) {
    // Format relative time
    const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays === 1) return "Kemarin";
        if (diffDays < 7) return `${diffDays} hari yang lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[var(--color-accent)]" />
                    <h3 className="font-semibold text-[var(--color-text)]">
                        Aktivitas Terakhir
                    </h3>
                </div>
                <Link href="/activity">
                    <Button variant="ghost" size="sm" className="text-[var(--color-accent)]">
                        Lihat Semua
                    </Button>
                </Link>
            </div>

            {/* Activity List */}
            <div className="mt-4 space-y-4">
                {activities.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[var(--color-text-subtle)]">
                        Belum ada aktivitas
                    </div>
                ) : (
                    activities.map((activity) => {
                        const Icon = typeIcons[activity.type];
                        const statusColor = activity.status
                            ? statusColors[activity.status]
                            : "text-[var(--color-text-subtle)]";

                        return (
                            <div key={activity.id} className="flex gap-3">
                                {/* Icon */}
                                <div className="flex-shrink-0">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-bg)]">
                                        <Icon className="h-5 w-5 text-[var(--color-accent)]" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium text-[var(--color-text)]">
                                        {activity.title}
                                    </p>
                                    {activity.description && (
                                        <p className="text-xs text-[var(--color-text-subtle)]">
                                            {activity.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[var(--color-text-subtle)]">
                                            {formatRelativeTime(activity.timestamp)}
                                        </span>
                                        {activity.status && (
                                            <>
                                                <span className="text-[var(--color-text-subtle)]">•</span>
                                                <span className={cn("font-medium capitalize", statusColor)}>
                                                    {activity.status === "success" && "Disetujui"}
                                                    {activity.status === "pending" && "Menunggu"}
                                                    {activity.status === "rejected" && "Ditolak"}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

RecentActivityWidget.displayName = "RecentActivityWidget";
