"use client";

// @ai:cx - Enhanced Approval Center with tabs and detail modal

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Calendar,
    Plane,
    Receipt,
    AlertCircle,
    User,
    FileText,
    ChevronRight,
    Inbox,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

type ApprovalType = "LEAVE" | "ATTENDANCE_CORRECTION" | "TRAVEL" | "REIMBURSE";

interface PendingApproval {
    id: string;
    type: ApprovalType;
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    status: string;
    createdAt: string;
    details: Record<string, unknown>;
}

interface ApprovalStats {
    pending: number;
    approved: number;
    rejected: number;
    byType: Record<ApprovalType, number>;
}

const tabs = [
    { id: "all", label: "Semua", icon: Inbox },
    { id: "LEAVE", label: "Cuti", icon: Calendar },
    { id: "ATTENDANCE_CORRECTION", label: "Koreksi", icon: AlertCircle },
    { id: "TRAVEL", label: "Perjalanan", icon: Plane },
    { id: "REIMBURSE", label: "Reimburse", icon: Receipt },
];

const typeConfig = {
    LEAVE: { label: "Cuti", color: "bg-blue-100 text-blue-700", icon: Calendar },
    ATTENDANCE_CORRECTION: { label: "Koreksi Absensi", color: "bg-orange-100 text-orange-700", icon: AlertCircle },
    TRAVEL: { label: "Perjalanan Dinas", color: "bg-purple-100 text-purple-700", icon: Plane },
    REIMBURSE: { label: "Reimburse", color: "bg-green-100 text-green-700", icon: Receipt },
};

export default function ApprovalsPage() {
    const [activeTab, setActiveTab] = useState<string>("all");
    const [items, setItems] = useState<PendingApproval[]>([]);
    const [stats, setStats] = useState<ApprovalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<PendingApproval | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const fetchApprovals = useCallback(async () => {
        try {
            setLoading(true);
            const typeParam = activeTab !== "all" ? `&type=${activeTab}` : "";
            const res = await fetchWithCsrf(`/api/approvals/all?status=PENDING${typeParam}`);
            const data = await res.json();
            if (data.success) {
                setItems(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetchWithCsrf("/api/approvals/stats");
            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchApprovals();
    }, [fetchApprovals]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    async function handleApprove(item: PendingApproval) {
        setProcessing(item.id);
        try {
            const typeMap: Record<ApprovalType, string> = {
                LEAVE: "leave",
                ATTENDANCE_CORRECTION: "correction",
                TRAVEL: "travel",
                REIMBURSE: "reimburse",
            };
            const res = await fetchWithCsrf(`/api/approvals/${typeMap[item.type]}/${item.id}/approve`, {
                method: "POST",
            });
            const data = await res.json();
            if (data.success) {
                setItems(items.filter((i) => i.id !== item.id));
                setSelectedItem(null);
                fetchStats();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    }

    async function handleReject(item: PendingApproval) {
        if (rejectReason.length < 10) {
            alert("Alasan penolakan minimal 10 karakter");
            return;
        }
        setProcessing(item.id);
        try {
            const typeMap: Record<ApprovalType, string> = {
                LEAVE: "leave",
                ATTENDANCE_CORRECTION: "correction",
                TRAVEL: "travel",
                REIMBURSE: "reimburse",
            };
            const res = await fetchWithCsrf(`/api/approvals/${typeMap[item.type]}/${item.id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason }),
            });
            const data = await res.json();
            if (data.success) {
                setItems(items.filter((i) => i.id !== item.id));
                setSelectedItem(null);
                setShowRejectDialog(false);
                setRejectReason("");
                fetchStats();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    }

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    const formatTime = (dateStr: string | null) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    };

    const formatCurrency = (amount: number | string | undefined) => {
        if (!amount) return "-";
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
            Number(amount)
        );
    };

    const renderDetails = (item: PendingApproval) => {
        const details = item.details;
        switch (item.type) {
            case "LEAVE":
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-500">Jenis Cuti</Label>
                                <p className="font-medium">{details.leaveType as string}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Total Hari</Label>
                                <p className="font-medium">{details.totalDays as number} hari</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Tanggal Mulai</Label>
                                <p className="font-medium">{formatDate(details.startDate as string)}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Tanggal Selesai</Label>
                                <p className="font-medium">{formatDate(details.endDate as string)}</p>
                            </div>
                        </div>
                        <div>
                            <Label className="text-slate-500">Alasan</Label>
                            <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm">{details.reason as string}</p>
                        </div>
                    </div>
                );
            case "ATTENDANCE_CORRECTION":
                return (
                    <div className="space-y-3">
                        <div>
                            <Label className="text-slate-500">Tanggal Absensi</Label>
                            <p className="font-medium">{formatDate(details.attendanceDate as string)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-500">Clock In Asli</Label>
                                <p className="font-medium">{formatTime(details.originalClockIn as string | null)}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Clock Out Asli</Label>
                                <p className="font-medium">{formatTime(details.originalClockOut as string | null)}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Clock In Koreksi</Label>
                                <p className="font-medium text-blue-600">
                                    {formatTime(details.requestedClockIn as string | null)}
                                </p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Clock Out Koreksi</Label>
                                <p className="font-medium text-blue-600">
                                    {formatTime(details.requestedClockOut as string | null)}
                                </p>
                            </div>
                        </div>
                        <div>
                            <Label className="text-slate-500">Alasan Koreksi</Label>
                            <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm">{details.reason as string}</p>
                        </div>
                    </div>
                );
            case "TRAVEL":
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-500">Tujuan</Label>
                                <p className="font-medium">{details.destination as string}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Estimasi Budget</Label>
                                <p className="font-medium">{formatCurrency(details.estimatedBudget as number)}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Berangkat</Label>
                                <p className="font-medium">{formatDate(details.departureDate as string)}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Kembali</Label>
                                <p className="font-medium">{formatDate(details.returnDate as string)}</p>
                            </div>
                        </div>
                        <div>
                            <Label className="text-slate-500">Tujuan Perjalanan</Label>
                            <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm">{details.purpose as string}</p>
                        </div>
                    </div>
                );
            case "REIMBURSE":
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-slate-500">Kategori</Label>
                                <p className="font-medium">{details.category as string}</p>
                            </div>
                            <div>
                                <Label className="text-slate-500">Total</Label>
                                <p className="font-medium text-green-600">
                                    {formatCurrency(details.totalAmount as number)}
                                </p>
                            </div>
                        </div>
                        <div>
                            <Label className="text-slate-500">Deskripsi</Label>
                            <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm">{details.description as string}</p>
                        </div>
                    </div>
                );
        }
    };

    const getDescription = (item: PendingApproval): string => {
        const details = item.details;
        switch (item.type) {
            case "LEAVE":
                return `${details.leaveType} - ${details.totalDays} hari`;
            case "ATTENDANCE_CORRECTION":
                return `Koreksi tanggal ${formatDate(details.attendanceDate as string)}`;
            case "TRAVEL":
                return `${details.destination} - ${formatCurrency(details.estimatedBudget as number)}`;
            case "REIMBURSE":
                return `${details.category} - ${formatCurrency(details.totalAmount as number)}`;
            default:
                return "";
        }
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Approval Center</h1>
                    <p className="text-slate-600">Kelola persetujuan pengajuan karyawan</p>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                    <span className="text-sm text-slate-600">Pending</span>
                                </div>
                                <p className="mt-1 text-2xl font-bold">{stats.pending}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm text-slate-600">Cuti</span>
                                </div>
                                <p className="mt-1 text-2xl font-bold">{stats.byType.LEAVE}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    <span className="text-sm text-slate-600">Koreksi</span>
                                </div>
                                <p className="mt-1 text-2xl font-bold">{stats.byType.ATTENDANCE_CORRECTION}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Plane className="h-5 w-5 text-purple-600" />
                                    <span className="text-sm text-slate-600">Travel</span>
                                </div>
                                <p className="mt-1 text-2xl font-bold">{stats.byType.TRAVEL}</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2">
                                    <Receipt className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-slate-600">Reimburse</span>
                                </div>
                                <p className="mt-1 text-2xl font-bold">{stats.byType.REIMBURSE}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const count = tab.id === "all" ? stats?.pending : stats?.byType[tab.id as ApprovalType];
                        return (
                            <Button
                                key={tab.id}
                                variant={activeTab === tab.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2 whitespace-nowrap"
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                                {count !== undefined && count > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {count}
                                    </Badge>
                                )}
                            </Button>
                        );
                    })}
                </div>

                {/* Content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">
                            {loading ? "Memuat..." : `${items.length} pengajuan menunggu`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {items.length === 0 ? (
                            <div className="py-12 text-center">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                                <p className="mt-4 text-slate-600">Tidak ada pengajuan yang perlu disetujui</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {items.map((item) => {
                                    const config = typeConfig[item.type];
                                    const Icon = config.icon;
                                    return (
                                        <div
                                            key={item.id}
                                            className="flex cursor-pointer items-center justify-between py-4 hover:bg-slate-50"
                                            onClick={() => setSelectedItem(item)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className={config.color}>
                                                            {config.label}
                                                        </Badge>
                                                        <span className="text-xs text-slate-500">
                                                            {formatDate(item.createdAt)}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-1 font-semibold text-slate-900">
                                                        {item.employeeName}
                                                    </h3>
                                                    <p className="text-sm text-slate-600">{getDescription(item)}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600 hover:bg-red-50"
                                                    disabled={processing === item.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedItem(item);
                                                        setShowRejectDialog(true);
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    disabled={processing === item.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApprove(item);
                                                    }}
                                                >
                                                    {processing === item.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Modal */}
            <Dialog open={!!selectedItem && !showRejectDialog} onOpenChange={() => setSelectedItem(null)}>
                <DialogContent className="max-w-md overflow-hidden p-0" aria-describedby={undefined}>
                    {selectedItem && (() => {
                        const config = typeConfig[selectedItem.type];
                        const TypeIcon = config.icon;
                        const colorMap = {
                            LEAVE: "from-blue-500 to-blue-600",
                            ATTENDANCE_CORRECTION: "from-orange-500 to-orange-600",
                            TRAVEL: "from-purple-500 to-purple-600",
                            REIMBURSE: "from-green-500 to-green-600",
                        };
                        return (
                            <>
                                {/* Screen reader only title for accessibility */}
                                <DialogTitle className="sr-only">
                                    Detail Pengajuan {config.label} dari {selectedItem.employeeName}
                                </DialogTitle>

                                {/* Colored Header Banner */}
                                <div className={`bg-gradient-to-r ${colorMap[selectedItem.type]} px-6 py-5 text-white`}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                                            <TypeIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white/80">Detail Pengajuan</p>
                                            <h2 className="text-xl font-bold">{config.label}</h2>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Employee Info Card */}
                                    <div className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
                                            <User className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-900">{selectedItem.employeeName}</p>
                                            <p className="text-sm text-slate-500">NIK: {selectedItem.employeeNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Diajukan</p>
                                            <p className="text-sm font-medium text-slate-600">{formatDate(selectedItem.createdAt)}</p>
                                        </div>
                                    </div>

                                    {/* Details Section */}
                                    <div className="mb-6">
                                        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                            <FileText className="h-4 w-4" />
                                            Informasi Detail
                                        </h3>
                                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                                            {renderDetails(selectedItem)}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                                            onClick={() => setShowRejectDialog(true)}
                                            disabled={processing === selectedItem.id}
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Tolak
                                        </Button>
                                        <Button
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            onClick={() => handleApprove(selectedItem)}
                                            disabled={processing === selectedItem.id}
                                        >
                                            {processing === selectedItem.id ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                            )}
                                            Setujui
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={() => setShowRejectDialog(false)}>
                <DialogContent className="max-w-md overflow-hidden p-0" aria-describedby={undefined}>
                    {/* Screen reader only title for accessibility */}
                    <DialogTitle className="sr-only">
                        Tolak Pengajuan {selectedItem ? typeConfig[selectedItem.type].label : ""} dari {selectedItem?.employeeName}
                    </DialogTitle>

                    {/* Red Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                                <XCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white/80">Konfirmasi</p>
                                <h2 className="text-xl font-bold">Tolak Pengajuan</h2>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Employee Info */}
                        {selectedItem && (
                            <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{selectedItem.employeeName}</p>
                                    <p className="text-sm text-slate-500">{typeConfig[selectedItem.type].label}</p>
                                </div>
                            </div>
                        )}

                        {/* Reason Input */}
                        <div className="mb-6">
                            <Label htmlFor="reason" className="text-sm font-semibold text-slate-700">
                                Alasan Penolakan <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="reason"
                                placeholder="Jelaskan alasan penolakan pengajuan ini..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-2 min-h-[120px] resize-none border-slate-200 focus:border-red-300 focus:ring-red-200"
                            />
                            <div className="mt-2 flex items-center justify-between">
                                {rejectReason.length > 0 && rejectReason.length < 10 ? (
                                    <p className="text-xs text-red-500">
                                        Minimal 10 karakter ({rejectReason.length}/10)
                                    </p>
                                ) : (
                                    <p className="text-xs text-slate-400">Minimal 10 karakter</p>
                                )}
                                <p className="text-xs text-slate-400">{rejectReason.length} karakter</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setShowRejectDialog(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => selectedItem && handleReject(selectedItem)}
                                disabled={processing === selectedItem?.id || rejectReason.length < 10}
                            >
                                {processing === selectedItem?.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <XCircle className="mr-2 h-4 w-4" />
                                )}
                                Tolak Pengajuan
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
