"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Megaphone, Plus, AlertTriangle, Info, Bell, Loader2 } from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: string;
    createdAt: string;
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        title: "",
        content: "",
        priority: "NORMAL",
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    async function fetchAnnouncements() {
        try {
            const res = await fetch("/api/announcements");
            const data = await res.json();
            if (data.success) {
                setAnnouncements(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/announcements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setShowForm(false);
                setForm({ title: "", content: "", priority: "NORMAL" });
                fetchAnnouncements();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    }

    const getPriorityStyle = (priority: string) => {
        const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
            HIGH: { bg: "bg-red-50 border-red-200", icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
            NORMAL: { bg: "bg-blue-50 border-blue-200", icon: <Info className="h-5 w-5 text-blue-500" /> },
            LOW: { bg: "bg-slate-50 border-slate-200", icon: <Bell className="h-5 w-5 text-slate-500" /> },
        };
        return styles[priority] || styles.NORMAL;
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

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
                        <h1 className="text-2xl font-bold text-slate-900">Pengumuman</h1>
                        <p className="text-slate-600">Informasi dan pengumuman perusahaan</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Baru
                    </Button>
                </div>

                {showForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-base">Buat Pengumuman</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Judul"
                                    placeholder="Judul pengumuman"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    required
                                />
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Konten</label>
                                    <textarea
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        rows={4}
                                        placeholder="Isi pengumuman..."
                                        value={form.content}
                                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Prioritas</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="NORMAL">Normal</option>
                                        <option value="HIGH">High</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Batal</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Publikasikan
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {announcements.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Megaphone className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Tidak ada pengumuman</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((ann) => {
                            const style = getPriorityStyle(ann.priority);
                            return (
                                <Card key={ann.id} className={`border ${style.bg}`}>
                                    <CardContent className="py-4">
                                        <div className="flex items-start gap-3">
                                            {style.icon}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                                                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{ann.content}</p>
                                                <p className="mt-2 text-xs text-slate-500">{formatDate(ann.createdAt)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
