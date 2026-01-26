"use client";

// @ai:cx - Admin Bank Change Request Management page

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Loader2,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    ArrowRight,
    User,
    Building,
} from "lucide-react";

interface Employee {
    id: string;
    fullName: string;
    employeeNumber: string;
    department?: { name: string };
    branch?: { name: string };
}

interface BankChangeRequest {
    id: string;
    employeeId: string;
    employee: Employee;
    oldBankName: string | null;
    oldAccountNumber: string | null;
    oldAccountHolder: string | null;
    oldBankBranch: string | null;
    newBankName: string;
    newAccountNumber: string;
    newAccountHolder: string;
    newBankBranch: string | null;
    reason: string | null;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason: string | null;
    createdAt: string;
    approvedAt: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminBankChangesPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<BankChangeRequest[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("PENDING");
    const [selectedRequest, setSelectedRequest] = useState<BankChangeRequest | null>(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [statusFilter]);

    async function fetchRequests(page = 1) {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
            });
            if (statusFilter && statusFilter !== "ALL") {
                params.set("status", statusFilter);
            }

            const res = await fetch(`/api/admin/bank-change-requests?${params}`);
            const data = await res.json();

            if (data.success) {
                setRequests(data.data.requests);
                setPagination(data.data.pagination);
            }
        } catch (err) {
            console.error(err);
            setError("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove() {
        if (!selectedRequest) return;
        setProcessing(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/bank-change-requests/${selectedRequest.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve" }),
            });

            const data = await res.json();

            if (data.success) {
                setShowDetailDialog(false);
                setSelectedRequest(null);
                await fetchRequests();
            } else {
                setError(data.error?.message || "Gagal menyetujui pengajuan");
            }
        } catch (err) {
            console.error(err);
            setError("Gagal menyetujui pengajuan");
        } finally {
            setProcessing(false);
        }
    }

    async function handleReject() {
        if (!selectedRequest || !rejectionReason) return;
        setProcessing(true);
        setError(null);

        try {
            const res = await fetch(`/api/admin/bank-change-requests/${selectedRequest.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reject",
                    rejectionReason,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setShowRejectDialog(false);
                setShowDetailDialog(false);
                setSelectedRequest(null);
                setRejectionReason("");
                await fetchRequests();
            } else {
                setError(data.error?.message || "Gagal menolak pengajuan");
            }
        } catch (err) {
            console.error(err);
            setError("Gagal menolak pengajuan");
        } finally {
            setProcessing(false);
        }
    }

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                        <Clock className="h-3 w-3" /> Menunggu
                    </span>
                );
            case "APPROVED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle2 className="h-3 w-3" /> Disetujui
                    </span>
                );
            case "REJECTED":
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        <XCircle className="h-3 w-3" /> Ditolak
                    </span>
                );
            default:
                return null;
        }
    };

    const pendingCount = requests.filter((r) => r.status === "PENDING").length;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Pengajuan Perubahan Data Bank</h1>
                    <p className="text-slate-600">
                        Kelola pengajuan perubahan rekening bank karyawan
                    </p>
                </div>

                {/* Stats */}
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Menunggu</p>
                                    <p className="text-2xl font-bold text-amber-600">
                                        {requests.filter((r) => r.status === "PENDING").length}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-amber-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Disetujui</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {requests.filter((r) => r.status === "APPROVED").length}
                                    </p>
                                </div>
                                <CheckCircle2 className="h-8 w-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500">Ditolak</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {requests.filter((r) => r.status === "REJECTED").length}
                                    </p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-red-500 hover:text-red-700"
                        >
                            <XCircle className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Filter */}
                <Card className="mb-6">
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                            <Label>Filter Status:</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">Menunggu</SelectItem>
                                    <SelectItem value="APPROVED">Disetujui</SelectItem>
                                    <SelectItem value="REJECTED">Ditolak</SelectItem>
                                    <SelectItem value="ALL">Semua</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Request List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4" />
                            Daftar Pengajuan
                            {pendingCount > 0 && statusFilter === "PENDING" && (
                                <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                                    {pendingCount} baru
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            </div>
                        ) : requests.length === 0 ? (
                            <p className="py-8 text-center text-slate-500">
                                Tidak ada pengajuan
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="rounded-lg border p-4 transition-colors hover:bg-slate-50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-400" />
                                                    <span className="font-medium">{req.employee.fullName}</span>
                                                    <span className="text-sm text-slate-500">
                                                        #{req.employee.employeeNumber}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                                                    {req.employee.department && (
                                                        <span className="flex items-center gap-1">
                                                            <Building className="h-3 w-3" />
                                                            {req.employee.department.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-3 flex items-center gap-2 text-sm">
                                                    <div className="rounded bg-slate-100 px-2 py-1">
                                                        <span className="text-slate-500">Lama:</span>{" "}
                                                        {req.oldBankName || "-"}
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                                    <div className="rounded bg-blue-50 px-2 py-1">
                                                        <span className="text-blue-600">Baru:</span>{" "}
                                                        {req.newBankName}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {getStatusBadge(req.status)}
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatDate(req.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setShowDetailDialog(true);
                                                }}
                                            >
                                                Lihat Detail
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-slate-500">
                                    Halaman {pagination.page} dari {pagination.totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page === 1}
                                        onClick={() => fetchRequests(pagination.page - 1)}
                                    >
                                        Sebelumnya
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={pagination.page === pagination.totalPages}
                                        onClick={() => fetchRequests(pagination.page + 1)}
                                    >
                                        Selanjutnya
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Dialog */}
            <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detail Pengajuan</DialogTitle>
                        <DialogDescription>
                            Pengajuan perubahan data bank
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            {/* Employee Info */}
                            <div className="rounded-lg bg-slate-50 p-3">
                                <p className="text-sm font-medium">{selectedRequest.employee.fullName}</p>
                                <p className="text-sm text-slate-500">
                                    #{selectedRequest.employee.employeeNumber}
                                </p>
                                {selectedRequest.employee.department && (
                                    <p className="text-sm text-slate-500">
                                        {selectedRequest.employee.department.name}
                                    </p>
                                )}
                            </div>

                            {/* Bank Info Comparison */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Old Bank */}
                                <div className="rounded-lg border p-3">
                                    <p className="mb-2 text-xs font-medium text-slate-500">DATA LAMA</p>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-slate-500">Bank:</span> {selectedRequest.oldBankName || "-"}</p>
                                        <p><span className="text-slate-500">Rekening:</span> {selectedRequest.oldAccountNumber || "-"}</p>
                                        <p><span className="text-slate-500">Atas Nama:</span> {selectedRequest.oldAccountHolder || "-"}</p>
                                        <p><span className="text-slate-500">Cabang:</span> {selectedRequest.oldBankBranch || "-"}</p>
                                    </div>
                                </div>

                                {/* New Bank */}
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                    <p className="mb-2 text-xs font-medium text-blue-600">DATA BARU</p>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="text-slate-500">Bank:</span> {selectedRequest.newBankName}</p>
                                        <p><span className="text-slate-500">Rekening:</span> {selectedRequest.newAccountNumber}</p>
                                        <p><span className="text-slate-500">Atas Nama:</span> {selectedRequest.newAccountHolder}</p>
                                        <p><span className="text-slate-500">Cabang:</span> {selectedRequest.newBankBranch || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            {selectedRequest.reason && (
                                <div>
                                    <p className="text-sm font-medium text-slate-500">Alasan Perubahan:</p>
                                    <p className="text-sm">{selectedRequest.reason}</p>
                                </div>
                            )}

                            {/* Status & Date */}
                            <div className="flex items-center justify-between text-sm">
                                <div>{getStatusBadge(selectedRequest.status)}</div>
                                <span className="text-slate-500">
                                    {formatDate(selectedRequest.createdAt)}
                                </span>
                            </div>

                            {/* Rejection Reason if rejected */}
                            {selectedRequest.status === "REJECTED" && selectedRequest.rejectionReason && (
                                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    <strong>Alasan Penolakan:</strong> {selectedRequest.rejectionReason}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {selectedRequest?.status === "PENDING" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRejectDialog(true)}
                                    disabled={processing}
                                >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Tolak
                                </Button>
                                <Button onClick={handleApprove} disabled={processing}>
                                    {processing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                    )}
                                    Setujui
                                </Button>
                            </>
                        )}
                        {selectedRequest?.status !== "PENDING" && (
                            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                                Tutup
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tolak Pengajuan</DialogTitle>
                        <DialogDescription>
                            Masukkan alasan penolakan pengajuan ini
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="rejectionReason">Alasan Penolakan *</Label>
                            <Textarea
                                id="rejectionReason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Masukkan alasan penolakan (min. 10 karakter)"
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectDialog(false);
                                setRejectionReason("");
                            }}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={processing || rejectionReason.length < 10}
                        >
                            {processing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Tolak Pengajuan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
