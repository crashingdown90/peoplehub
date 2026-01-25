// @ai:ag - Recent Activity Feed component

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Activity {
    id: string;
    type: "ATTENDANCE" | "LEAVE" | "PAYROLL" | "ANNOUNCEMENT" | "OTHER";
    title: string;
    description: string;
    timestamp: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
}

interface RecentActivityFeedProps {
    activities: Activity[];
    maxItems?: number;
}

export function RecentActivityFeed({
    activities,
    maxItems = 5,
}: RecentActivityFeedProps) {
    const getTypeColor = (type: string) => {
        switch (type) {
            case "ATTENDANCE":
                return "bg-blue-100 text-blue-600";
            case "LEAVE":
                return "bg-purple-100 text-purple-600";
            case "PAYROLL":
                return "bg-green-100 text-green-600";
            case "ANNOUNCEMENT":
                return "bg-amber-100 text-amber-600";
            default:
                return "bg-slate-100 text-slate-600";
        }
    };

    const getDefaultIcon = (type: string) => {
        const iconClass = "h-4 w-4";
        switch (type) {
            case "ATTENDANCE":
                return <Clock className={iconClass} />;
            case "LEAVE":
                return (
                    <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" />
                    </svg>
                );
            case "PAYROLL":
                return (
                    <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                );
            default:
                return <Clock className={iconClass} />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 7) return `${diffDays} hari yang lalu`;

        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        });
    };

    const displayedActivities = activities.slice(0, maxItems);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Aktivitas Terkini</CardTitle>
            </CardHeader>
            <CardContent>
                {displayedActivities.length === 0 ? (
                    <div className="text-center py-8">
                        <Clock className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Belum ada aktivitas</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayedActivities.map((activity, index) => (
                            <div
                                key={activity.id}
                                className={`flex gap-3 ${index !== displayedActivities.length - 1
                                        ? "pb-4 border-b"
                                        : ""
                                    }`}
                            >
                                {/* Icon */}
                                <div
                                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(
                                        activity.type
                                    )}`}
                                >
                                    {activity.icon || getDefaultIcon(activity.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 leading-tight">
                                        {activity.title}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                        {activity.description}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <p className="text-xs text-slate-500">
                                            {formatTimestamp(activity.timestamp)}
                                        </p>
                                        {activity.actionLabel && activity.onAction && (
                                            <button
                                                onClick={activity.onAction}
                                                className="text-xs text-blue-600 hover:underline font-medium"
                                            >
                                                {activity.actionLabel}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
