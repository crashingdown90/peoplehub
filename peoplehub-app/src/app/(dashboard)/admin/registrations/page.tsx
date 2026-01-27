"use client";

// @ai:cl - Registration approval page for HRD - Updated for Phase 1A

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    Mail,
    Calendar,
    Filter,
    Phone,
    Building2,
    CreditCard,
    User,
    MapPin,
    FileText,
    AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { BANK_LIST } from "@/constants/banks";
import { fetchWithCsrf } from "@/lib/api-client";

interface Registration {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    // Phase 1A fields
    gender?: string;
    birthPlace?: string;
    birthDate?: string;
    // Bank data
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    // Documents
    photoUrl?: string;
    ktpPhotoUrl?: string;
    // Optional fields
    nik?: string;
    npwp?: string;
    address?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    // Tenant
    tenantId?: string;
    tenantName?: string;
    tenantCode?: string;
}

export default function RegistrationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selected, setSelected] = useState<Registration | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectError, setRejectError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">(
        (searchParams.get("status") as "PENDING" | "APPROVED" | "REJECTED") || "PENDING"
    );
    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ id: string; type: "approve" | "reject" } | null>(null);
    const [showPhotoModal, setShowPhotoModal] = useState<string | null>(null);

    useEffect(() => {
        fetchRegistrations(filterStatus);
    }, [filterStatus]);

    useEffect(() => {
        const next = new URLSearchParams(searchParams.toString());
        next.set("status", filterStatus);
        if (search.trim()) next.set("q", search.trim());
        else next.delete("q");
        router.replace(`?${next.toString()}`);
    }, [filterStatus, search, router, searchParams]);

    async function fetchRegistrations(status: "PENDING" | "APPROVED" | "REJECTED") {
        try {
            setLoading(true);
            const res = await fetchWithCsrf(`/api/admin/registrations?status=${status}`);
            const data = await res.json();
            if (data.success) {
                setRegistrations(data.data);
                setSelected(null);
                setRejectReason("");
                setRejectError(null);
                setFeedback(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id: string, confirmed = false) {
        if (!confirmed) {
            setConfirmAction({ id, type: "approve" });
            return;
        }
        setProcessingId(id);
        try {
            const res = await fetchWithCsrf(`/api/admin/registrations/${id}/approve`, { method: "POST" });
            if (res.ok) {
                setRegistrations((prev) => prev.filter((r) => r.id !== id));
                if (selected?.id === id) {
                    setSelected(null);
                    setRejectReason("");
                }
                setFeedback({ type: "success", message: "Registrasi disetujui." });
            }
        } catch (err) {
            console.error(err);
            setFeedback({ type: "error", message: "Gagal memproses permintaan." });
        } finally {
            setProcessingId(null);
            setConfirmAction(null);
        }
    }

    async function handleReject(id: string, reason: string, confirmed = false) {
        if (!confirmed) {
            if (!reason || reason.trim().length < 10) {
                setRejectError("Alasan penolakan minimal 10 karakter.");
                return;
            }
            setConfirmAction({ id, type: "reject" });
            return;
        }
        setRejectError(null);
        setProcessingId(id);
        try {
            const res = await fetchWithCsrf(`/api/admin/registrations/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason }),
            });
            if (res.ok) {
                setRegistrations((prev) => prev.filter((r) => r.id !== id));
                if (selected?.id === id) {
                    setSelected(null);
                    setRejectReason("");
                }
                setFeedback({ type: "success", message: "Registrasi ditolak." });
            }
        } catch (err) {
            console.error(err);
            setFeedback({ type: "error", message: "Gagal memproses permintaan." });
        } finally {
            setProcessingId(null);
            setConfirmAction(null);
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

    const formatBirthDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getBankName = (code?: string) => {
        if (!code) return "-";
        const bank = BANK_LIST.find((b) => b.code === code);
        return bank?.name || code;
    };

    const getGenderLabel = (gender?: string) => {
        if (gender === "MALE") return "Laki-laki";
        if (gender === "FEMALE") return "Perempuan";
        return "-";
    };

    const statusBadge = useMemo(
        () => ({
            PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
            APPROVED: "bg-green-50 text-green-700 border border-green-200",
            REJECTED: "bg-red-50 text-red-700 border border-red-200",
        }),
        []
    );

    const filtered = useMemo(() => {
        if (!search.trim()) return registrations;
        const term = search.toLowerCase();
        return registrations.filter((reg) =>
            [reg.fullName, reg.email, reg.phone, reg.tenantName, reg.nik].some((field) =>
                (field || "").toLowerCase().includes(term)
            )
        );
    }, [registrations, search]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Registrasi Karyawan</h1>
                        <p className="text-slate-600">{registrations.length} pendaftaran {filterStatus.toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="rounded-lg bg-yellow-50 px-2 py-1 font-medium text-yellow-700">Pending</span>
                        <span className="rounded-lg bg-green-50 px-2 py-1 font-medium text-green-700">Approved</span>
                        <span className="rounded-lg bg-red-50 px-2 py-1 font-medium text-red-700">Rejected</span>
                    </div>
                </div>

                <div className="mb-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-1 items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 md:w-44"
                        >
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <Input
                            placeholder="Cari nama, email, NIK, atau perusahaan"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                {feedback && (
                    <Toast message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />
                )}

                {filtered.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Tidak ada registrasi ditemukan</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                        {/* Registration List */}
                        <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                            {filtered.map((reg) => {
                                const isActive = selected?.id === reg.id;
                                return (
                                    <Card
                                        key={reg.id}
                                        className={`cursor-pointer transition-shadow ${isActive ? "border-blue-500 shadow-md" : "hover:shadow-sm"}`}
                                        onClick={() => {
                                            setSelected(reg);
                                            setRejectReason("");
                                            setRejectError(null);
                                        }}
                                    >
                                        <CardContent className="py-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3">
                                                    {/* Photo or Avatar */}
                                                    {reg.photoUrl ? (
                                                        <div className="relative h-12 w-12 rounded-full overflow-hidden">
                                                            <Image
                                                                src={reg.photoUrl}
                                                                alt={reg.fullName}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
                                                            {reg.fullName.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900">{reg.fullName}</h3>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                {reg.tenantName || "-"}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {formatDate(reg.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm text-slate-500">{reg.email}</p>
                                                    </div>
                                                </div>
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[reg.status as keyof typeof statusBadge] || statusBadge.PENDING}`}>
                                                    {reg.status}
                                                </span>
                                            </div>
                                            {filterStatus === "PENDING" && (
                                                <div className="mt-3 flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        disabled={processingId === reg.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelected(reg);
                                                            setRejectReason("");
                                                            setRejectError(null);
                                                        }}
                                                    >
                                                        <XCircle className="mr-1 h-4 w-4" />
                                                        Tolak
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        disabled={processingId === reg.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleApprove(reg.id);
                                                        }}
                                                    >
                                                        {processingId === reg.id ? (
                                                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="mr-1 h-4 w-4" />
                                                        )}
                                                        Setujui
                                                    </Button>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Detail Panel */}
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="py-4">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-slate-900">Detail Pendaftaran</h3>
                                        {selected && (
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[selected.status as keyof typeof statusBadge] || statusBadge.PENDING}`}>
                                                {selected.status}
                                            </span>
                                        )}
                                    </div>

                                    {!selected ? (
                                        <div className="py-8 text-center">
                                            <User className="mx-auto h-12 w-12 text-slate-300" />
                                            <p className="mt-4 text-sm text-slate-500">Pilih pendaftaran untuk melihat detail</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Photo Section */}
                                            <div className="flex items-center gap-4">
                                                {selected.photoUrl ? (
                                                    <div
                                                        className="relative h-24 w-24 rounded-lg overflow-hidden cursor-pointer border border-slate-200"
                                                        onClick={() => setShowPhotoModal(selected.photoUrl!)}
                                                    >
                                                        <Image
                                                            src={selected.photoUrl}
                                                            alt={selected.fullName}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                                        <User className="h-12 w-12" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="text-xl font-semibold text-slate-900">{selected.fullName}</h4>
                                                    <p className="text-sm text-slate-500">{selected.email}</p>
                                                    <p className="text-sm text-slate-500">{selected.phone}</p>
                                                </div>
                                            </div>

                                            {/* Company Info */}
                                            <div className="rounded-lg bg-blue-50 p-3 border border-blue-100">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-blue-600" />
                                                    <span className="font-medium text-blue-800">{selected.tenantName}</span>
                                                    <span className="text-xs text-blue-600">({selected.tenantCode})</span>
                                                </div>
                                            </div>

                                            {/* Personal Data */}
                                            <div>
                                                <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <User className="h-4 w-4" /> Data Pribadi
                                                </h5>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <DetailRow label="Jenis Kelamin" value={getGenderLabel(selected.gender)} />
                                                    <DetailRow label="Tempat Lahir" value={selected.birthPlace || "-"} />
                                                    <DetailRow label="Tanggal Lahir" value={formatBirthDate(selected.birthDate)} />
                                                    <DetailRow label="NIK" value={selected.nik || "-"} />
                                                    <DetailRow label="NPWP" value={selected.npwp || "-"} />
                                                </div>
                                            </div>

                                            {/* Address */}
                                            {selected.address && (
                                                <div>
                                                    <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                        <MapPin className="h-4 w-4" /> Alamat
                                                    </h5>
                                                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                                        {selected.address}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Bank Data */}
                                            <div>
                                                <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" /> Data Bank
                                                </h5>
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <DetailRow label="Bank" value={getBankName(selected.bankName)} />
                                                    <DetailRow label="No. Rekening" value={selected.bankAccountNumber || "-"} />
                                                    <DetailRow label="Nama Pemilik" value={selected.bankAccountHolder || "-"} />
                                                </div>
                                            </div>

                                            {/* Emergency Contact */}
                                            {(selected.emergencyContactName || selected.emergencyContactPhone) && (
                                                <div>
                                                    <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                        <Phone className="h-4 w-4" /> Kontak Darurat
                                                    </h5>
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        <DetailRow label="Nama" value={selected.emergencyContactName || "-"} />
                                                        <DetailRow label="No. Telepon" value={selected.emergencyContactPhone || "-"} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* KTP Photo */}
                                            {selected.ktpPhotoUrl && (
                                                <div>
                                                    <h5 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                                        <FileText className="h-4 w-4" /> Foto KTP
                                                    </h5>
                                                    <div
                                                        className="relative h-40 w-full rounded-lg overflow-hidden cursor-pointer border border-slate-200"
                                                        onClick={() => setShowPhotoModal(selected.ktpPhotoUrl!)}
                                                    >
                                                        <Image
                                                            src={selected.ktpPhotoUrl}
                                                            alt="KTP"
                                                            fill
                                                            className="object-contain bg-slate-50"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions for Pending */}
                                            {filterStatus === "PENDING" && (
                                                <div className="space-y-3 pt-4 border-t">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-700">
                                                            Alasan Penolakan (wajib jika menolak)
                                                        </label>
                                                        <textarea
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            placeholder="Tuliskan alasan penolakan (minimal 10 karakter)"
                                                            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                                            rows={3}
                                                        />
                                                        {rejectError && (
                                                            <p className="text-xs text-red-600 flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                {rejectError}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-col gap-2 sm:flex-row">
                                                        <Button
                                                            variant="outline"
                                                            className="flex-1 text-red-600 hover:bg-red-50"
                                                            disabled={processingId === selected.id}
                                                            onClick={() => handleReject(selected.id, rejectReason)}
                                                        >
                                                            {processingId === selected.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                            )}
                                                            Tolak Pendaftaran
                                                        </Button>
                                                        <Button
                                                            className="flex-1"
                                                            disabled={processingId === selected.id}
                                                            onClick={() => handleApprove(selected.id)}
                                                        >
                                                            {processingId === selected.id ? (
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                            )}
                                                            Setujui Pendaftaran
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Registration Time */}
                                            <div className="text-xs text-slate-400 pt-2 border-t">
                                                Didaftarkan: {formatDate(selected.createdAt)}
                                                {selected.updatedAt !== selected.createdAt && (
                                                    <> | Diperbarui: {formatDate(selected.updatedAt)}</>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Dialog */}
            {confirmAction && (
                <ConfirmDialog
                    type={confirmAction.type}
                    onCancel={() => setConfirmAction(null)}
                    onConfirm={() => {
                        if (confirmAction.type === "approve") {
                            handleApprove(confirmAction.id, true);
                        } else {
                            handleReject(confirmAction.id, rejectReason, true);
                        }
                    }}
                />
            )}

            {/* Photo Modal */}
            {showPhotoModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                    onClick={() => setShowPhotoModal(null)}
                >
                    <div className="relative max-w-3xl max-h-[90vh]">
                        <Image
                            src={showPhotoModal}
                            alt="Photo"
                            width={800}
                            height={600}
                            className="rounded-lg object-contain"
                        />
                        <button
                            onClick={() => setShowPhotoModal(null)}
                            className="absolute top-2 right-2 bg-white/90 text-slate-700 p-2 rounded-full hover:bg-white"
                            aria-label="Tutup foto"
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-slate-100 px-3 py-2 bg-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-800">{value}</p>
        </div>
    );
}

function ConfirmDialog({
    type,
    onCancel,
    onConfirm,
}: {
    type: "approve" | "reject";
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const isApprove = type === "approve";
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
                <h3 className="text-lg font-semibold text-slate-900">
                    {isApprove ? "Setujui pendaftaran?" : "Tolak pendaftaran?"}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                    {isApprove
                        ? "Pengguna akan diaktifkan dan dapat login ke sistem."
                        : "Pengguna akan ditolak dan dapat mendaftar ulang dengan email yang sama."}
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>
                        Batal
                    </Button>
                    <Button
                        className="flex-1"
                        variant={isApprove ? "default" : "destructive"}
                        onClick={onConfirm}
                    >
                        {isApprove ? "Setujui" : "Tolak"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

function Toast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: "success" | "error";
    onClose: () => void;
}) {
    const tone =
        type === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700";

    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed right-4 top-4 z-50 flex items-start gap-2 rounded-lg border px-4 py-3 shadow-lg ${tone}`}>
            <div className="text-sm font-medium">{message}</div>
            <button
                onClick={onClose}
                className="ml-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                aria-label="Tutup notifikasi"
            >
                &times;
            </button>
        </div>
    );
}
