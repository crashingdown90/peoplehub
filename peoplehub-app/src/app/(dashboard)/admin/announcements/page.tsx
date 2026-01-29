"use client";

// @ai:cx - Admin announcements management page

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus, Loader2, Megaphone, Eye, Archive,
    Send, Trash2, Pin, AlertTriangle, AlertCircle, Info, Bell
} from "lucide-react";
import { useCsrf } from "@/hooks/useCsrf";

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: string;
    isPinned: boolean;
    status: string;
    createdAt: string;
    publishedAt: string | null;
    createdBy?: { fullName: string };
    _count?: { reads: number };
}

type TabStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export default function AdminAnnouncementsPage() {
    const router = useRouter();
    const { getHeaders } = useCsrf();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabStatus>("PUBLISHED");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/announcements?mode=admin&status=${activeTab}`);
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    const handleAction = async (id: string, action: "publish" | "archive" | "delete") => {
        if (action === "delete" && !confirm("Yakin ingin menghapus pengumuman ini?")) return;

        setActionLoading(id);
        try {
            const method = action === "delete" ? "DELETE" : "PUT";
            const body = action === "delete" ? undefined : JSON.stringify({ action });

            const res = await fetch(`/api/announcements/${id}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders(),
                },
                body,
            });

            if (res.ok) {
                fetchAnnouncements();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(null);
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "URGENT":
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case "HIGH":
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case "NORMAL":
                return <Info className="h-4 w-4 text-blue-500" />;
            default:
                return <Bell className="h-4 w-4 text-slate-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            DRAFT: "bg-yellow-100 text-yellow-700",
            PUBLISHED: "bg-green-100 text-green-700",
            ARCHIVED: "bg-slate-100 text-slate-600",
        };
        return styles[status] || styles.DRAFT;
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const tabs: { status: TabStatus; label: string }[] = [
        { status: "PUBLISHED", label: "Published" },
        { status: "DRAFT", label: "Draft" },
        { status: "ARCHIVED", label: "Archived" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Kelola Pengumuman</h1>
                        <p className="text-slate-600">Buat dan kelola pengumuman untuk karyawan</p>
                    </div>
                    <Button onClick={() => router.push("/admin/announcements/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Pengumuman
                    </Button>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.status}
                            onClick={() => setActiveTab(tab.status)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.status
                                ? "bg-blue-600 text-white"
                                : "bg-white text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">
                                Tidak ada pengumuman {activeTab.toLowerCase()}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <Card key={ann.id} className={ann.isPinned ? "border-blue-200 bg-blue-50/50" : ""}>
                                <CardContent className="py-4">
                                    <div className="flex items-start gap-4">
                                        {/* Priority Icon */}
                                        <div className="mt-1">{getPriorityIcon(ann.priority)}</div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {ann.isPinned && (
                                                    <Pin className="h-4 w-4 text-blue-500" />
                                                )}
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {ann.title}
                                                </h3>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(ann.status)}`}>
                                                    {ann.status}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                                                {ann.content}
                                            </p>
                                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                                                <span>Oleh: {ann.createdBy?.fullName || "Unknown"}</span>
                                                <span>
                                                    {ann.status === "PUBLISHED"
                                                        ? `Dipublish: ${formatDate(ann.publishedAt)}`
                                                        : `Dibuat: ${formatDate(ann.createdAt)}`}
                                                </span>
                                                {ann.status === "PUBLISHED" && ann._count && (
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {ann._count.reads} dibaca
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/admin/announcements/${ann.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            {ann.status === "DRAFT" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAction(ann.id, "publish")}
                                                    disabled={actionLoading === ann.id}
                                                >
                                                    {actionLoading === ann.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Send className="h-4 w-4 text-green-600" />
                                                    )}
                                                </Button>
                                            )}

                                            {ann.status === "PUBLISHED" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAction(ann.id, "archive")}
                                                    disabled={actionLoading === ann.id}
                                                >
                                                    {actionLoading === ann.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Archive className="h-4 w-4 text-slate-600" />
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAction(ann.id, "delete")}
                                                disabled={actionLoading === ann.id}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
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
