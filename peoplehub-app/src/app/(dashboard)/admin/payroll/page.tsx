"use client";

// @ai:cx - Admin Payroll Management

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CreditCard, Download, Loader2, ChevronDown, FileText,
    CheckCircle, AlertCircle, Play, Send, RefreshCw
} from "lucide-react";

interface Payslip {
    id: string;
    period: string;
    status: "DRAFT" | "PUBLISHED";
    netSalary: number;
    grossSalary: number;
    totalDeductions: number;
    publishedAt: string | null;
    employee: {
        id: string;
        fullName: string;
        employeeNumber: string;
        department?: { name: string };
    };
}

interface PeriodStats {
    total: number;
    draft: number;
    published: number;
    totalNetSalary: number;
}

export default function AdminPayrollPage() {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // Filters
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });
    const [selectedStatus, setSelectedStatus] = useState("");
    const [stats, setStats] = useState<PeriodStats | null>(null);

    // Available periods (last 12 months)
    const periods = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    });

    const formatPeriod = (period: string) => {
        const [year, month] = period.split("-");
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

    const fetchPayslips = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                period: selectedPeriod,
                ...(selectedStatus ? { status: selectedStatus } : {}),
            });
            const res = await fetch(`/api/payroll/payslips?${params}`);
            const data = await res.json();
            if (data.success) {
                setPayslips(data.data);
                setTotal(data.meta?.total || 0);

                // Calculate stats
                const allForStats = data.data as Payslip[];
                setStats({
                    total: data.meta?.total || allForStats.length,
                    draft: allForStats.filter((p) => p.status === "DRAFT").length,
                    published: allForStats.filter((p) => p.status === "PUBLISHED").length,
                    totalNetSalary: allForStats.reduce((sum, p) => sum + p.netSalary, 0),
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, selectedPeriod, selectedStatus]);

    useEffect(() => {
        fetchPayslips();
    }, [fetchPayslips]);

    const handleGenerate = async () => {
        if (!confirm(`Generate slip gaji untuk periode ${formatPeriod(selectedPeriod)}?`)) return;

        setGenerating(true);
        try {
            const res = await fetch("/api/payroll/payslips/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ period: selectedPeriod }),
            });
            const data = await res.json();

            if (data.success) {
                alert(`Berhasil generate ${data.data.success} slip gaji. ${data.data.failed > 0 ? `${data.data.failed} gagal.` : ""}`);
                fetchPayslips();
            } else {
                alert(data.error?.message || "Gagal generate slip gaji");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        } finally {
            setGenerating(false);
        }
    };

    const handleBulkPublish = async () => {
        const draftCount = stats?.draft || 0;
        if (draftCount === 0) {
            alert("Tidak ada slip gaji draft untuk dipublish");
            return;
        }

        if (!confirm(`Publish ${draftCount} slip gaji draft untuk periode ${formatPeriod(selectedPeriod)}?`)) return;

        setPublishing(true);
        try {
            const res = await fetch("/api/payroll/payslips/publish", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ period: selectedPeriod }),
            });
            const data = await res.json();

            if (data.success) {
                alert(`Berhasil publish ${data.data.published} slip gaji`);
                fetchPayslips();
            } else {
                alert(data.error?.message || "Gagal publish slip gaji");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        } finally {
            setPublishing(false);
        }
    };

    const openPdf = (id: string) => {
        window.open(`/api/payroll/payslips/${id}/pdf`, "_blank");
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Manajemen Payroll</h1>
                    <p className="text-slate-600">Kelola slip gaji karyawan</p>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Slip</p>
                                    <p className="text-xl font-bold text-slate-900">{stats?.total || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Draft</p>
                                    <p className="text-xl font-bold text-slate-900">{stats?.draft || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Published</p>
                                    <p className="text-xl font-bold text-slate-900">{stats?.published || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                                    <CreditCard className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500">Total Gaji Bersih</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {formatCurrency(stats?.totalNetSalary || 0)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions & Filters */}
                <Card className="mb-6">
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Periode</label>
                                    <div className="relative">
                                        <select
                                            value={selectedPeriod}
                                            onChange={(e) => { setSelectedPeriod(e.target.value); setPage(1); }}
                                            className="appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            {periods.map((p) => (
                                                <option key={p} value={p}>{formatPeriod(p)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
                                    <div className="relative">
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                                            className="appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="">Semua</option>
                                            <option value="DRAFT">Draft</option>
                                            <option value="PUBLISHED">Published</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                                <div className="pt-5">
                                    <Button variant="ghost" size="sm" onClick={fetchPayslips}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleGenerate}
                                    disabled={generating}
                                >
                                    {generating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="mr-2 h-4 w-4" />
                                    )}
                                    Generate Slip Gaji
                                </Button>
                                <Button
                                    onClick={handleBulkPublish}
                                    disabled={publishing || (stats?.draft || 0) === 0}
                                >
                                    {publishing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Publish Semua ({stats?.draft || 0})
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payslips Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Daftar Slip Gaji - {formatPeriod(selectedPeriod)}</CardTitle>
                        <CardDescription>{total} slip gaji</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : payslips.length === 0 ? (
                            <div className="py-12 text-center">
                                <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-4 text-slate-600">Belum ada slip gaji untuk periode ini</p>
                                <Button variant="outline" className="mt-4" onClick={handleGenerate}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Generate Sekarang
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="pb-3 font-medium text-slate-500">Karyawan</th>
                                                <th className="pb-3 font-medium text-slate-500">Department</th>
                                                <th className="pb-3 font-medium text-slate-500 text-right">Gaji Kotor</th>
                                                <th className="pb-3 font-medium text-slate-500 text-right">Potongan</th>
                                                <th className="pb-3 font-medium text-slate-500 text-right">Gaji Bersih</th>
                                                <th className="pb-3 font-medium text-slate-500 text-center">Status</th>
                                                <th className="pb-3 font-medium text-slate-500 text-center">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payslips.map((slip) => (
                                                <tr key={slip.id} className="border-b last:border-0">
                                                    <td className="py-3">
                                                        <div>
                                                            <p className="font-medium text-slate-900">{slip.employee.fullName}</p>
                                                            <p className="text-xs text-slate-500">#{slip.employee.employeeNumber}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-slate-600">
                                                        {slip.employee.department?.name || "-"}
                                                    </td>
                                                    <td className="py-3 text-right text-slate-600">
                                                        {formatCurrency(slip.grossSalary)}
                                                    </td>
                                                    <td className="py-3 text-right text-red-600">
                                                        -{formatCurrency(slip.totalDeductions)}
                                                    </td>
                                                    <td className="py-3 text-right font-medium text-green-600">
                                                        {formatCurrency(slip.netSalary)}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                                            slip.status === "PUBLISHED"
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}>
                                                            {slip.status === "PUBLISHED" ? "Published" : "Draft"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openPdf(slip.id)}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {total > 20 && (
                                    <div className="mt-4 flex items-center justify-center gap-2 border-t pt-4">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Sebelumnya
                                        </Button>
                                        <span className="text-sm text-slate-600">
                                            Halaman {page} dari {Math.ceil(total / 20)}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page * 20 >= total}
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
