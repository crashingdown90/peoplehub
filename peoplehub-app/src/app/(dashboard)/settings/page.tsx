"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Download, Loader2 } from "lucide-react";

export default function SettingsPage() {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        // Default: current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split("T")[0]);
        setEndDate(lastDay.toISOString().split("T")[0]);
    }, []);

    async function exportAttendance() {
        if (!startDate || !endDate) return;
        setExporting(true);
        try {
            const res = await fetch(`/api/admin/export/attendance?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `attendance-${startDate}-to-${endDate}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setExporting(false);
        }
    }

    async function exportAudit() {
        setExporting(true);
        try {
            const res = await fetch(`/api/admin/audit/export?format=csv&startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `audit-logs-${startDate}-to-${endDate}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                    <p className="text-slate-600">Pengaturan dan export data</p>
                </div>

                {/* Export Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Download className="h-5 w-5" /> Export Data
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                label="Tanggal Mulai"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                            <Input
                                label="Tanggal Akhir"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button onClick={exportAttendance} disabled={exporting}>
                                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Export Kehadiran
                            </Button>
                            <Button variant="outline" onClick={exportAudit} disabled={exporting}>
                                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Export Audit Log
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* App Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Settings className="h-5 w-5" /> Informasi Aplikasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Aplikasi</span>
                            <span className="font-medium">PeopleHub</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Versi</span>
                            <span className="font-medium">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Framework</span>
                            <span className="font-medium">Next.js 16</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Database</span>
                            <span className="font-medium">PostgreSQL + Prisma</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
