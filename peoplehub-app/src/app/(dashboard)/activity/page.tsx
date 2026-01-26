"use client";

// @ai:cx - Activity history page - Real-time user activities

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
    ArrowLeft,
    Activity,
    Clock,
    Calendar,
    DollarSign,
    FileText,
    RefreshCw,
    Filter,
    ChevronDown,
} from "lucide-react";

interface ActivityItem {
    id: string;
    type: "attendance" | "leave" | "overtime" | "reimbursement" | "payslip";
    title: string;
    description?: string;
    timestamp: string;
    status?: "success" | "pending" | "rejected";
    metadata?: Record<string, unknown>;
}

const typeIcons = {
    attendance: Clock,
    leave: Calendar,
    overtime: Clock,
    reimbursement: DollarSign,
    payslip: FileText,
};

const typeLabels = {
    attendance: "Kehadiran",
    leave: "Cuti",
    overtime: "Lembur",
    reimbursement: "Reimburse",
    payslip: "Slip Gaji",
};

const statusStyles = {
    success: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-red-100 text-red-700",
};

const statusLabels = {
    success: "Disetujui",
    pending: "Menunggu",
    rejected: "Ditolak",
};

export default function ActivityPage() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<string | null>(null);
    const [showFilter, setShowFilter] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchActivities = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        try {
            if (pageNum === 1) {
                setIsLoading(true);
            }
            setError(null);

            const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: "20",
            });

            if (filter) {
                params.append("type", filter);
            }

            const res = await fetch(`/api/activities/me?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                if (append) {
                    setActivities(prev => [...prev, ...data.data]);
                } else {
                    setActivities(data.data);
                }
                setHasMore(data.meta.page < data.meta.totalPages);
            } else {
                setError(data.error?.message || "Gagal memuat aktivitas");
            }
        } catch (err) {
            console.error("Fetch activities error:", err);
            setError("Terjadi kesalahan saat memuat data");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [filter]);

    useEffect(() => {
        setPage(1);
        fetchActivities(1);
    }, [fetchActivities]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isLoading && !isRefreshing) {
                fetchActivities(1);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchActivities, isLoading, isRefreshing]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setPage(1);
        fetchActivities(1);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchActivities(nextPage, true);
    };

    const handleFilterChange = (newFilter: string | null) => {
        setFilter(newFilter);
        setShowFilter(false);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Relative time for recent activities
        if (diffMins < 1) return "Baru saja";
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;

        // Full date for older activities
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filterOptions = [
        { value: null, label: "Semua Aktivitas" },
        { value: "attendance", label: "Kehadiran" },
        { value: "leave", label: "Cuti" },
        { value: "reimbursement", label: "Reimburse" },
        { value: "overtime", label: "Lembur" },
    ];

    if (isLoading && activities.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Riwayat Aktivitas</h1>
                            <p className="text-slate-600">Lihat semua aktivitas terkini</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                </div>

                {/* Filter */}
                <div className="mb-4 relative">
                    <Button
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => setShowFilter(!showFilter)}
                    >
                        <span className="flex items-center gap-2">
                            <Filter className="h-4 w-4" />
                            {filterOptions.find(f => f.value === filter)?.label || "Semua Aktivitas"}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilter ? "rotate-180" : ""}`} />
                    </Button>
                    {showFilter && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.value ?? "all"}
                                    onClick={() => handleFilterChange(option.value)}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                                        filter === option.value ? "bg-blue-50 text-blue-600" : ""
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
                        <p>{error}</p>
                        <Button
                            variant="link"
                            className="mt-2 h-auto p-0 text-red-600"
                            onClick={handleRefresh}
                        >
                            Coba lagi
                        </Button>
                    </div>
                )}

                {/* Activity List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5" />
                            Aktivitas
                            {isRefreshing && (
                                <span className="ml-2 text-xs font-normal text-slate-500">
                                    Memperbarui...
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activities.length === 0 ? (
                            <div className="py-12 text-center">
                                <Activity className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-4 text-slate-500">
                                    {filter ? `Belum ada aktivitas ${typeLabels[filter as keyof typeof typeLabels] || ""}` : "Belum ada aktivitas"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity) => {
                                    const Icon = typeIcons[activity.type] || Activity;
                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex gap-4 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                                <Icon className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium text-slate-900">
                                                        {activity.title}
                                                    </span>
                                                    {activity.status && (
                                                        <span
                                                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[activity.status]}`}
                                                        >
                                                            {statusLabels[activity.status]}
                                                        </span>
                                                    )}
                                                </div>
                                                {activity.description && (
                                                    <p className="mt-1 text-sm text-slate-500 truncate">
                                                        {activity.description}
                                                    </p>
                                                )}
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {formatDate(activity.timestamp)}
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                                                    {typeLabels[activity.type] || activity.type}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="pt-4 text-center">
                                        <Button
                                            variant="outline"
                                            onClick={handleLoadMore}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                    Memuat...
                                                </>
                                            ) : (
                                                "Muat Lebih Banyak"
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Auto-refresh indicator */}
                <p className="mt-4 text-center text-xs text-slate-400">
                    Data diperbarui otomatis setiap 30 detik
                </p>
            </div>
        </div>
    );
}
