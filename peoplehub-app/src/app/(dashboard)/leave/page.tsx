"use client";

// @ai:cx

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { leaveRequestSchema, type LeaveRequestInput } from "@/lib/validations";
import { ArrowLeft, Calendar, FileText } from "lucide-react";

interface LeaveType {
    id: string;
    code: string;
    name: string;
    requiresAttachment: boolean;
}

interface LeaveBalance {
    id: string;
    leaveType: { id: string; code: string; name: string };
    year: number;
    initialBalance: number;
    usedBalance: number;
    remainingBalance: number;
}

interface LeaveRequest {
    id: string;
    leaveType: { id: string; name: string };
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: string;
    createdAt: string;
}

export default function LeavePage() {
    const router = useRouter();
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<LeaveRequestInput>({
        resolver: zodResolver(leaveRequestSchema),
    });

    const selectedLeaveTypeId = watch("leaveTypeId");
    const startDate = watch("startDate");
    const endDate = watch("endDate");

    // Calculate days
    const calculateDays = useCallback(() => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) return 0;

        let days = 0;
        const current = new Date(start);
        while (current <= end) {
            if (current.getDay() !== 0 && current.getDay() !== 6) days++;
            current.setDate(current.getDate() + 1);
        }
        return days;
    }, [startDate, endDate]);

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            const [typesRes, balanceRes, requestsRes] = await Promise.all([
                fetch("/api/leave/types"),
                fetch("/api/leave/balance"),
                fetch("/api/leave/requests"),
            ]);

            const [typesData, balanceData, requestsData] = await Promise.all([
                typesRes.json(),
                balanceRes.json(),
                requestsRes.json(),
            ]);

            if (typesData.success) setLeaveTypes(typesData.data);
            if (balanceData.success) setBalances(balanceData.data);
            if (requestsData.success) setRequests(requestsData.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onSubmit = async (data: LeaveRequestInput) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch("/api/leave/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || "Gagal mengajukan cuti");
                return;
            }

            alert(result.message);
            reset();
            setShowForm(false);
            await fetchData();
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const cancelRequest = async (id: string) => {
        if (!confirm("Yakin ingin membatalkan pengajuan cuti ini?")) return;

        try {
            const response = await fetch(`/api/leave/requests/${id}`, { method: "DELETE" });
            const result = await response.json();

            if (!response.ok) {
                alert(result.error?.message || "Gagal membatalkan pengajuan");
                return;
            }

            await fetchData();
        } catch {
            alert("Terjadi kesalahan");
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-amber-100 text-amber-700",
            APPROVED_MANAGER: "bg-blue-100 text-blue-700",
            APPROVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
            CANCELLED: "bg-slate-100 text-slate-700",
        };
        const labels: Record<string, string> = {
            PENDING: "Menunggu",
            APPROVED_MANAGER: "Disetujui Manager",
            APPROVED: "Disetujui",
            REJECTED: "Ditolak",
            CANCELLED: "Dibatalkan",
        };
        return (
            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${styles[status] || "bg-slate-100"}`}>
                {labels[status] || status}
            </span>
        );
    };

    const selectedBalance = balances.find(b => b.leaveType.id === selectedLeaveTypeId);
    const calculatedDays = calculateDays();

    if (isLoading) {
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
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Pengajuan Cuti</h1>
                        <p className="text-slate-600">Lihat saldo dan ajukan cuti</p>
                    </div>
                </div>

                {/* Leave Balances */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                    {balances.map(balance => (
                        <Card key={balance.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">{balance.leaveType.name}</p>
                                        <p className="text-2xl font-bold text-slate-900">{balance.remainingBalance}</p>
                                        <p className="text-xs text-slate-400">dari {balance.initialBalance} hari</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                        <Calendar className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Request Form */}
                {showForm ? (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Form Pengajuan Cuti</CardTitle>
                            <CardDescription>Isi form berikut untuk mengajukan cuti</CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <CardContent className="space-y-4">
                                {error && (
                                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
                                )}

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Jenis Cuti</label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        {...register("leaveTypeId")}
                                    >
                                        <option value="">Pilih jenis cuti</option>
                                        {leaveTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.name}</option>
                                        ))}
                                    </select>
                                    {errors.leaveTypeId && <p className="mt-1 text-sm text-red-600">{errors.leaveTypeId.message}</p>}
                                </div>

                                {selectedBalance && (
                                    <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                                        Sisa saldo: <strong>{selectedBalance.remainingBalance} hari</strong>
                                    </div>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Tanggal Mulai"
                                        type="date"
                                        error={errors.startDate?.message}
                                        {...register("startDate")}
                                    />
                                    <Input
                                        label="Tanggal Selesai"
                                        type="date"
                                        error={errors.endDate?.message}
                                        {...register("endDate")}
                                    />
                                </div>

                                {calculatedDays > 0 && (
                                    <div className="rounded-lg bg-slate-100 p-3 text-sm">
                                        Total: <strong>{calculatedDays} hari kerja</strong>
                                        {selectedBalance && calculatedDays > selectedBalance.remainingBalance && (
                                            <span className="ml-2 text-red-600">(Melebihi saldo!)</span>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Alasan</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Jelaskan alasan pengajuan cuti..."
                                        {...register("reason")}
                                    />
                                    {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>}
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Batal
                                </Button>
                                <Button type="submit" isLoading={isSubmitting}>
                                    Ajukan Cuti
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                ) : (
                    <Button onClick={() => setShowForm(true)} className="mb-6 w-full">
                        + Ajukan Cuti Baru
                    </Button>
                )}

                {/* Request History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Riwayat Pengajuan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <p className="text-center text-sm text-slate-500 py-8">Belum ada pengajuan cuti</p>
                        ) : (
                            <div className="space-y-4">
                                {requests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium text-slate-900">{req.leaveType.name}</span>
                                                {getStatusBadge(req.status)}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {new Date(req.startDate).toLocaleDateString("id-ID")} - {new Date(req.endDate).toLocaleDateString("id-ID")}
                                                <span className="ml-2">({req.totalDays} hari)</span>
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">{req.reason}</p>
                                        </div>
                                        {req.status === "PENDING" && (
                                            <Button variant="ghost" size="sm" onClick={() => cancelRequest(req.id)}>
                                                Batalkan
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
