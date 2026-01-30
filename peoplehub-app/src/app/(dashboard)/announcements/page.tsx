"use client";

// @ai:cx - Announcements inbox page for all users

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Megaphone, Loader2, Pin, AlertTriangle, AlertCircle,
    Info, Bell, Mail, MailOpen, Filter
} from "lucide-react";
import { useCsrf } from "@/hooks/useCsrf";

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: string;
    isPinned: boolean;
    publishedAt: string;
    isRead: boolean;
    createdBy?: { fullName: string };
    attachments?: Array<{ name: string; url: string; type: string; size: number }>;
}

type FilterType = "all" | "unread" | "pinned";

export default function AnnouncementsInboxPage() {
    const router = useRouter();
    const { getHeaders } = useCsrf();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [markingRead, setMarkingRead] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const unreadOnly = filter === "unread" ? "&unreadOnly=true" : "";
            const res = await fetch(`/api/announcements?${unreadOnly}`);
            const data = await res.json();
            if (data.success) {
                let filtered = data.data;
                if (filter === "pinned") {
                    filtered = filtered.filter((a: Announcement) => a.isPinned);
                }
                setAnnouncements(filtered);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleSelect = async (ann: Announcement) => {
        setSelectedId(ann.id);

        // Mark as read if not already
        if (!ann.isRead) {
            setMarkingRead(true);
            try {
                await fetch(`/api/announcements/${ann.id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...getHeaders(),
                    },
                    body: JSON.stringify({ action: "read" }),
                });

                // Update local state
                setAnnouncements((prev) =>
                    prev.map((a) => (a.id === ann.id ? { ...a, isRead: true } : a))
                );
                window.dispatchEvent(new CustomEvent("unread-updated"));
            } catch (err) {
                console.error(err);
            } finally {
                setMarkingRead(false);
            }
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case "HIGH":
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            case "NORMAL":
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-slate-400" />;
        }
    };

    const getPriorityBg = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return "bg-red-50 border-red-200";
            case "HIGH":
                return "bg-orange-50 border-orange-200";
            default:
                return "";
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        } else if (diffDays === 1) {
            return "Kemarin";
        } else if (diffDays < 7) {
            return `${diffDays} hari lalu`;
        } else {
            return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
        }
    };

    const selectedAnnouncement = announcements.find((a) => a.id === selectedId);
    const unreadCount = announcements.filter((a) => !a.isRead).length;

    const filters: { type: FilterType; label: string; icon?: React.ReactNode }[] = [
        { type: "all", label: "Semua" },
        { type: "unread", label: `Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
        { type: "pinned", label: "Penting", icon: <Pin className="h-3 w-3" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-6xl p-4 md:p-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Pengumuman</h1>
                    <p className="text-slate-600">Informasi dan pengumuman dari perusahaan</p>
                </div>

                {/* Filters */}
                <div className="mb-4 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    {filters.map((f) => (
                        <button
                            key={f.type}
                            onClick={() => {
                                setFilter(f.type);
                                setSelectedId(null);
                            }}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filter === f.type
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            {f.icon}
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Tidak ada pengumuman</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* List */}
                        <div className="space-y-2">
                            {announcements.map((ann) => (
                                <div
                                    key={ann.id}
                                    onClick={() => handleSelect(ann)}
                                    className={`cursor-pointer rounded-lg border p-4 transition-all ${selectedId === ann.id
                                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                        : ann.isRead
                                            ? "border-slate-200 bg-white hover:border-slate-300"
                                            : `border-slate-200 bg-white hover:border-slate-300 ${getPriorityBg(ann.priority)}`
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Read indicator */}
                                        <div className="mt-0.5">
                                            {ann.isRead ? (
                                                <MailOpen className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <Mail className="h-5 w-5 text-blue-600" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                {ann.isPinned && <Pin className="h-3 w-3 text-blue-500" />}
                                                <h3 className={`truncate ${ann.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
                                                    {ann.title}
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                                                {ann.content}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                                                <span>{ann.createdBy?.fullName}</span>
                                                <span>{formatDate(ann.publishedAt)}</span>
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <div>{getPriorityIcon(ann.priority)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Detail View */}
                        <div className="hidden lg:block">
                            {selectedAnnouncement ? (
                                <Card className="sticky top-4">
                                    <CardContent className="p-6">
                                        {markingRead && (
                                            <div className="mb-2 text-xs text-slate-400">
                                                <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />
                                                Menandai sebagai dibaca...
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            {getPriorityIcon(selectedAnnouncement.priority)}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {selectedAnnouncement.isPinned && (
                                                        <Pin className="h-4 w-4 text-blue-500" />
                                                    )}
                                                    <h2 className="text-xl font-bold text-slate-900">
                                                        {selectedAnnouncement.title}
                                                    </h2>
                                                </div>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    {selectedAnnouncement.createdBy?.fullName} •{" "}
                                                    {new Date(selectedAnnouncement.publishedAt).toLocaleDateString("id-ID", {
                                                        weekday: "long",
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 whitespace-pre-wrap text-slate-700">
                                            {selectedAnnouncement.content}
                                        </div>

                                        {/* Attachments */}
                                        {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                                            <div className="mt-6 border-t pt-4">
                                                <h4 className="mb-2 text-sm font-medium text-slate-700">
                                                    Lampiran
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedAnnouncement.attachments.map((att, i) => (
                                                        <a
                                                            key={i}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 rounded-lg border p-2 text-sm text-blue-600 hover:bg-blue-50"
                                                        >
                                                            {att.name}
                                                            <span className="text-xs text-slate-400">
                                                                ({Math.round(att.size / 1024)} KB)
                                                            </span>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
                                        <p className="mt-4 text-slate-500">
                                            Pilih pengumuman untuk melihat detail
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile Detail Modal */}
                {selectedAnnouncement && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:hidden" onClick={() => setSelectedId(null)}>
                        <div
                            className="max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4 flex justify-center">
                                <div className="h-1 w-12 rounded-full bg-slate-300" />
                            </div>

                            <div className="flex items-start gap-3">
                                {getPriorityIcon(selectedAnnouncement.priority)}
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-slate-900">
                                        {selectedAnnouncement.title}
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {selectedAnnouncement.createdBy?.fullName} •{" "}
                                        {formatDate(selectedAnnouncement.publishedAt)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 whitespace-pre-wrap text-slate-700">
                                {selectedAnnouncement.content}
                            </div>

                            <Button
                                variant="outline"
                                className="mt-6 w-full"
                                onClick={() => setSelectedId(null)}
                            >
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
