"use client";

// @ai:cx - Shift swap request page

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowLeftRight, Calendar, Clock, User, Loader2, X } from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

interface Partner {
    id: string;
    name: string;
    employeeNumber: string;
    department: string;
}

interface SwapRequest {
    id: string;
    requester: { id: string; name: string; employeeNumber: string };
    partner: { id: string; name: string; employeeNumber: string };
    requesterShiftDate: string;
    partnerShiftDate: string;
    requesterShift: string;
    partnerShift: string;
    reason: string;
    status: string;
    createdAt: string;
}

const statusStyles: Record<string, string> = {
    PENDING_PARTNER: "bg-amber-100 text-amber-700",
    PENDING_MANAGER: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
    PENDING_PARTNER: "Menunggu Partner",
    PENDING_MANAGER: "Menunggu Manager",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
    CANCELLED: "Dibatalkan",
};

export default function ShiftSwapPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<SwapRequest[]>([]);
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        partnerId: "",
        requesterShiftDate: "",
        partnerShiftDate: "",
        reason: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [swapRes, partnerRes] = await Promise.all([
                fetchWithCsrf("/api/shift-swap"),
                fetchWithCsrf("/api/shift-swap/partners"),
            ]);

            const swapData = await swapRes.json();
            const partnerData = await partnerRes.json();

            if (swapData.success) setRequests(swapData.data);
            if (partnerData.success) setPartners(partnerData.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetchWithCsrf("/api/shift-swap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (data.success) {
                setShowForm(false);
                setForm({ partnerId: "", requesterShiftDate: "", partnerShiftDate: "", reason: "" });
                fetchData();
            } else {
                setError(data.error?.message || "Gagal mengajukan tukar shift");
            }
        } catch (err) {
            console.error(err);
            setError("Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleApprovePartner(id: string) {
        try {
            const res = await fetchWithCsrf(`/api/shift-swap/${id}/approve-partner`, { method: "POST" });
            const data = await res.json();
            if (data.success) fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleReject(id: string) {
        const reason = prompt("Alasan penolakan (min 10 karakter):");
        if (!reason || reason.length < 10) return;

        try {
            const res = await fetchWithCsrf(`/api/shift-swap/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (data.success) fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    async function handleCancel(id: string) {
        if (!confirm("Batalkan pengajuan tukar shift ini?")) return;

        try {
            const res = await fetchWithCsrf(`/api/shift-swap/${id}/cancel`, { method: "POST" });
            const data = await res.json();
            if (data.success) fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
                        <h1 className="text-2xl font-bold text-slate-900">Tukar Shift</h1>
                        <p className="text-slate-600">Ajukan pertukaran shift dengan rekan kerja</p>
                    </div>
                </div>

                {/* Request Form */}
                {showForm ? (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Form Tukar Shift</CardTitle>
                            <CardDescription>Pilih rekan kerja dan tanggal shift yang ingin ditukar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Tukar dengan Karyawan
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        value={form.partnerId}
                                        onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
                                        required
                                    >
                                        <option value="">Pilih karyawan...</option>
                                        {partners.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.department})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="Tanggal Shift Saya"
                                        type="date"
                                        value={form.requesterShiftDate}
                                        onChange={(e) => setForm({ ...form, requesterShiftDate: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Tanggal Shift Partner"
                                        type="date"
                                        value={form.partnerShiftDate}
                                        onChange={(e) => setForm({ ...form, partnerShiftDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Alasan
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        placeholder="Jelaskan alasan pertukaran shift (minimal 10 karakter)..."
                                        value={form.reason}
                                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                        required
                                        minLength={10}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Ajukan Tukar Shift
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Button onClick={() => setShowForm(true)} className="mb-6 w-full">
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        Ajukan Tukar Shift Baru
                    </Button>
                )}

                {/* Request History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ArrowLeftRight className="h-5 w-5" />
                            Riwayat Pertukaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <div className="py-12 text-center">
                                <ArrowLeftRight className="mx-auto h-12 w-12 text-slate-300" />
                                <p className="mt-4 text-slate-500">Belum ada pengajuan tukar shift</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="rounded-lg border border-slate-200 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium text-slate-900">
                                                    {request.partner.name}
                                                </span>
                                            </div>
                                            <span
                                                className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusStyles[request.status] || "bg-gray-100"}`}
                                            >
                                                {statusLabels[request.status] || request.status}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600">{request.reason}</p>

                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                            <div className="rounded-lg bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Shift Saya</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium">
                                                        {formatDate(request.requesterShiftDate)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm">{request.requesterShift}</span>
                                                </div>
                                            </div>
                                            <div className="rounded-lg bg-blue-50 p-3">
                                                <p className="text-xs text-slate-500">Shift Partner</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium">
                                                        {formatDate(request.partnerShiftDate)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm">{request.partnerShift}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        {request.status === "PENDING_PARTNER" && (
                                            <div className="mt-3 flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-green-600"
                                                    onClick={() => handleApprovePartner(request.id)}
                                                >
                                                    Setujui
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-red-600"
                                                    onClick={() => handleReject(request.id)}
                                                >
                                                    Tolak
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleCancel(request.id)}
                                                >
                                                    <X className="mr-1 h-3 w-3" />
                                                    Batalkan
                                                </Button>
                                            </div>
                                        )}
                                        {request.status === "PENDING_MANAGER" && (
                                            <div className="mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleCancel(request.id)}
                                                >
                                                    <X className="mr-1 h-3 w-3" />
                                                    Batalkan
                                                </Button>
                                            </div>
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
