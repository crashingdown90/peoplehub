"use client";

// @ai:cx - Activity feed list

import type { ReactElement } from "react";
import { Activity, CalendarClock, Megaphone, Shield, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

type ActivityType = "attendance" | "leave" | "announcement" | "system";

interface ActivityItem {
    id: string;
    type: ActivityType;
    title: string;
    description: string;
    timestamp: Date;
    actor?: { name: string; avatar?: string };
}

interface ActivityFeedProps {
    items: ActivityItem[];
    loading?: boolean;
    maxItems?: number;
}

const typeIcon: Record<ActivityType, ReactElement> = {
    attendance: <CalendarClock className="h-4 w-4 text-blue-600" />,
    leave: <Shield className="h-4 w-4 text-green-600" />,
    announcement: <Megaphone className="h-4 w-4 text-orange-600" />,
    system: <Activity className="h-4 w-4 text-slate-600" />,
};

export function ActivityFeed({ items, loading, maxItems }: ActivityFeedProps) {
    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3">
                        <Skeleton variant="circle" width="32px" height="32px" />
                        <div className="flex-1 space-y-2">
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="80%" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const list = maxItems ? items.slice(0, maxItems) : items;

    if (!list.length) {
        return <p className="text-sm text-slate-500">Belum ada aktivitas terbaru.</p>;
    }

    return (
        <div className="space-y-3">
            {list.map((item) => (
                <div key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3">
                    <div className="mt-0.5">{typeIcon[item.type] || <User className="h-4 w-4 text-slate-500" />}</div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                            <span className="text-xs text-slate-500">
                                {formatDistanceToNow(item.timestamp, { addSuffix: true, locale: id })}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">{item.description}</p>
                        {item.actor && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                <Avatar className="h-6 w-6">
                                    {item.actor.avatar && <AvatarImage src={item.actor.avatar} alt={item.actor.name} />}
                                    <AvatarFallback className="text-xs">{item.actor.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span>{item.actor.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
