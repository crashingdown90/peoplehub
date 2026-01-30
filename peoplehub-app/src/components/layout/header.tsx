"use client";

// @ai:cx - Dashboard header with notifications and user menu

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { Announcement } from "@/types";

interface HeaderProps {
    onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { unreadCount } = useNotifications({ autoFetch: true, pollingInterval: 30000 });
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);
    const notificationMenuRef = useRef<HTMLDetailsElement>(null);

    const displayName = useMemo(() => user?.employee?.fullName || user?.email || "Pengguna", [user]);
    const totalUnread = unreadCount + unreadAnnouncements;
    const mergedNotifications = useMemo(() => {
        const notifItems = recentNotifications.map((notif) => ({
            id: `notif-${notif.id}`,
            title: notif.title,
            message: notif.message,
            date: new Date(notif.createdAt),
            link: notif.link || "/notifications",
        }));
        const annItems = announcements.map((ann) => ({
            id: `ann-${ann.id}`,
            title: ann.title,
            message: ann.content,
            date: new Date(ann.publishedAt || ann.createdAt),
            link: "/announcements",
        }));

        return [...notifItems, ...annItems]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);
    }, [recentNotifications, announcements]);
    const visibleNotifications = mergedNotifications.slice(0, 5);

    const trimMessage = (message: string) => {
        const plain = message.replace(/\s+/g, " ").trim();
        return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
    };

    useEffect(() => {
        const fetchUnreadAnnouncements = async () => {
            try {
                const res = await fetch("/api/announcements/unread-count");
                const data = await res.json();
                if (data.success) {
                    setUnreadAnnouncements(data.data.count || 0);
                }
            } catch {
                // Silent fail
            }
        };

        fetchUnreadAnnouncements();
        const interval = setInterval(fetchUnreadAnnouncements, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (notificationMenuRef.current) {
            notificationMenuRef.current.open = false;
        }
    }, [pathname]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await fetch("/api/announcements?unreadOnly=true&limit=5");
                const data = await res.json();
                if (data.success) {
                    setAnnouncements(data.data || []);
                }
            } catch {
                // Silent fail
            }
        };

        fetchAnnouncements();
        const interval = setInterval(fetchAnnouncements, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchRecentNotifications = async () => {
            try {
                const res = await fetch("/api/notifications?unread=true&limit=5");
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    setRecentNotifications(data.data);
                }
            } catch {
                // Silent fail
            }
        };

        fetchRecentNotifications();
        const interval = setInterval(fetchRecentNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-(--color-border) bg-(--color-surface)/90 px-4 py-3 backdrop-blur transition-colors">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label="Toggle sidebar"
                    onClick={onMenuToggle}
                    className="rounded-lg p-2 text-(--color-text-subtle) hover:bg-(--color-border)"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <details className="group" ref={notificationMenuRef}>
                        <summary
                            className="list-none cursor-pointer rounded-lg p-2 text-(--color-text-subtle) transition hover:bg-(--color-border)"
                            aria-label="Notifikasi"
                        >
                            <div className="relative">
                                <Bell className="h-5 w-5" />
                                {totalUnread > 0 && (
                                    <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-(--color-error) px-1 text-[9px] font-semibold text-white">
                                        {totalUnread}
                                    </span>
                                )}
                            </div>
                        </summary>
                        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) shadow-lg">
                            <div className="border-b border-(--color-border) px-4 py-2 text-sm font-semibold text-(--color-text)">
                                Notifikasi
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {visibleNotifications.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-(--color-text-subtle)">
                                        Belum ada notifikasi
                                    </div>
                                ) : (
                                    visibleNotifications.map((notif) => (
                                        <Link
                                            key={notif.id}
                                            href={notif.link}
                                            className="block px-4 py-3 text-sm hover:bg-(--color-border)"
                                            onClick={() => {
                                                if (notificationMenuRef.current) {
                                                    notificationMenuRef.current.open = false;
                                                }
                                            }}
                                        >
                                            <div className="font-medium text-(--color-text)">
                                                {notif.title}
                                            </div>
                                            <div className="mt-0.5 text-xs text-(--color-text-subtle)">
                                                {trimMessage(notif.message)}
                                            </div>
                                            <div className="mt-1 text-[11px] text-(--color-text-muted)">
                                                {notif.date.toLocaleString("id-ID")}
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                            <div className="border-t border-(--color-border) px-4 py-2">
                                <Link
                                    href="/notifications"
                                    className="text-xs font-semibold text-(--color-accent) hover:underline"
                                >
                                    Lihat semua
                                </Link>
                            </div>
                        </div>
                    </details>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-2 py-1 shadow-sm">
                    <Avatar className="h-8 w-8">
                        {user?.photoUrl ? (
                            <AvatarImage src={user.photoUrl} alt={displayName} />
                        ) : null}
                        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="hidden text-sm leading-tight md:block">
                        <p className="font-semibold text-(--color-text)">{displayName}</p>
                        <p className="text-xs text-(--color-text-subtle)">{user?.role || "-"}</p>
                    </div>
                    <UserDropdown />
                </div>
            </div>
        </header>
    );
}

function UserDropdown() {
    return (
        <div className="relative">
            <details className="group">
                <summary className="list-none cursor-pointer rounded-lg p-1 text-(--color-text-subtle) transition hover:bg-(--color-border)">
                    <User className="h-4 w-4" />
                </summary>
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-(--color-border) bg-(--color-surface) shadow-lg">
                    <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-(--color-text) hover:bg-(--color-border)"
                    >
                        Profil
                    </Link>
                    <form action="/api/auth/logout" method="POST">
                        <button
                            type="submit"
                            className="block w-full px-4 py-2 text-left text-sm text-(--color-error) hover:bg-(--color-error-bg)"
                        >
                            Keluar
                        </button>
                    </form>
                </div>
            </details>
        </div>
    );
}
