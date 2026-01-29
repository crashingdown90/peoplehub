"use client";

// @ai:cx - Admin announcement detail page

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Pin, AlertTriangle, AlertCircle, Info, Bell } from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: string;
    isPinned: boolean;
    status: string;
    createdAt: string;
    publishedAt: string | null;
    createdBy?: { fullName: string; email?: string };
    attachments?: Array<{ name: string; url: string; type?: string; size?: number }>;
    _count?: { reads: number };
}

export default function AdminAnnouncementDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string | undefined;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchDetail = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/announcements/${id}`);
                const data = await res.json();
                if (!res.ok) {
                    setError(data.error?.message || "Gagal memuat detail pengumuman");
                    return;
                }
                setAnnouncement(data.data);
            } catch (err) {
                setError("Terjadi kesalahan saat memuat detail");
            } finally {
                setLoading(false);
            }
        };

        fetchDetail();
    }, [id]);

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

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                </div>

                {loading ? (
                    <Card>
                        <CardContent className="py-10 text-center text-slate-500">
                            Memuat detail pengumuman...
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card>
                        <CardContent className="py-10 text-center text-red-600">
                            {error}
                        </CardContent>
                    </Card>
                ) : announcement ? (
                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <div className="mt-1">{getPriorityIcon(announcement.priority)}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {announcement.isPinned && <Pin className="h-4 w-4 text-blue-500" />}
                                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(announcement.status)}`}>
                                            {announcement.status}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                        <span>Oleh: {announcement.createdBy?.fullName || "Unknown"}</span>
                                        <span>Dibuat: {formatDate(announcement.createdAt)}</span>
                                        {announcement.publishedAt && (
                                            <span>Dipublish: {formatDate(announcement.publishedAt)}</span>
                                        )}
                                        {announcement._count && (
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {announcement._count.reads} dibaca
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="prose prose-slate max-w-none">
                                <p className="whitespace-pre-wrap text-slate-700">{announcement.content}</p>
                            </div>

                            {announcement.attachments && announcement.attachments.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="mb-2 text-sm font-semibold text-slate-900">Lampiran</h4>
                                    <ul className="space-y-2">
                                        {announcement.attachments.map((att, idx) => (
                                            <li key={`${att.url}-${idx}`}>
                                                <a
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    {att.name || att.url}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : null}
            </div>
        </div>
    );
}
