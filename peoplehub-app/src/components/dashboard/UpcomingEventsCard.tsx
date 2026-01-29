// @ai:ag - Upcoming Events/Announcements Card

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell } from "lucide-react";

interface Event {
    id: string;
    title: string;
    type: "ANNOUNCEMENT" | "HOLIDAY" | "MEETING" | "DEADLINE" | "OTHER";
    date: string;
    description?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
}

interface UpcomingEventsCardProps {
    events: Event[];
    maxItems?: number;
}

export function UpcomingEventsCard({
    events,
    maxItems = 5,
}: UpcomingEventsCardProps) {
    const getTypeBadge = (type: string) => {
        switch (type) {
            case "ANNOUNCEMENT":
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Pengumuman</Badge>;
            case "HOLIDAY":
                return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Libur</Badge>;
            case "MEETING":
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Meeting</Badge>;
            case "DEADLINE":
                return <Badge className="bg-red-100 text-red-700 border-red-200">Deadline</Badge>;
            default:
                return <Badge variant="secondary">Lainnya</Badge>;
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case "HIGH":
                return "border-l-red-500";
            case "MEDIUM":
                return "border-l-amber-500";
            case "LOW":
                return "border-l-blue-500";
            default:
                return "border-l-slate-300";
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dateOnly = date.toDateString();
        const todayOnly = today.toDateString();
        const tomorrowOnly = tomorrow.toDateString();

        if (dateOnly === todayOnly) {
            return "Hari ini";
        } else if (dateOnly === tomorrowOnly) {
            return "Besok";
        } else {
            return date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
            });
        }
    };

    const sortedEvents = [...events]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, maxItems);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5 text-blue-600" />
                        Agenda & Pengumuman
                    </CardTitle>
                    {events.length > maxItems && (
                        <span className="text-xs text-slate-500">
                            +{events.length - maxItems} lainnya
                        </span>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {sortedEvents.length === 0 ? (
                    <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Tidak ada agenda mendatang</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sortedEvents.map((event, index) => (
                            <div
                                key={event.id}
                                className={`p-3 border-l-4 rounded-lg bg-slate-50 ${getPriorityColor(
                                    event.priority
                                )} ${index !== sortedEvents.length - 1 ? "mb-3" : ""}`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="text-sm font-semibold text-slate-900 flex-1">
                                        {event.title}
                                    </h4>
                                    {getTypeBadge(event.type)}
                                </div>

                                {event.description && (
                                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                                        {event.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(event.date)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
