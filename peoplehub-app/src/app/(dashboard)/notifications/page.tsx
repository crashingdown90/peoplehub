"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWithCsrf } from "@/lib/api-client";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        try {
            const res = await fetchWithCsrf("/api/notifications");
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.meta.unreadCount);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function markAsRead(id: string) {
        await fetchWithCsrf(`/api/notifications/${id}/read`, { method: "POST" });
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
    }

    async function markAllAsRead() {
        await fetchWithCsrf("/api/notifications/read-all", { method: "POST" });
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return "Baru saja";
        if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
        return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            ATTENDANCE: "bg-blue-100 text-blue-600",
            LEAVE: "bg-green-100 text-green-600",
            APPROVAL: "bg-purple-100 text-purple-600",
            SYSTEM: "bg-orange-100 text-orange-600",
        };
        return colors[type] || "bg-slate-100 text-slate-600";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Notifikasi</h1>
                        <p className="text-slate-600">
                            {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua sudah dibaca"}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Tandai Semua Dibaca
                        </Button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Bell className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Tidak ada notifikasi</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {notifications.map((notif) => (
                            <Card
                                key={notif.id}
                                className={`cursor-pointer transition-colors ${!notif.isRead ? "bg-blue-50/50" : ""}`}
                                onClick={async () => {
                                    if (!notif.isRead) await markAsRead(notif.id);
                                    if (notif.link) router.push(notif.link);
                                }}
                            >
                                <CardContent className="py-3">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${getTypeColor(notif.type)}`}>
                                            <Bell className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className={`text-sm ${!notif.isRead ? "font-semibold" : "font-medium"} text-slate-900`}>
                                                    {notif.title}
                                                </h3>
                                                <span className="shrink-0 text-xs text-slate-500">
                                                    {formatTime(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 text-sm text-slate-600 line-clamp-2">{notif.message}</p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
