"use client";

// @ai:cx - Bank Change Request page for employees

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Send,
} from "lucide-react";
import Link from "next/link";

interface BankChangeRequest {
    id: string;
    oldBankName: string | null;
    oldAccountNumber: string | null;
    oldAccountHolder: string | null;
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

interface CurrentBankInfo {
    bankName: string | null;
    bankAccountNumber: string | null;
    bankAccountHolder: string | null;
    bankBranch: string | null;
}

interface Bank {
    code: string;
    name: string;
}

const BANK_LIST: Bank[] = [
    { code: "BCA", name: "Bank Central Asia (BCA)" },
    { code: "MANDIRI", name: "Bank Mandiri" },
    { code: "BNI", name: "Bank Negara Indonesia (BNI)" },
    { code: "BRI", name: "Bank Rakyat Indonesia (BRI)" },
    { code: "CIMB", name: "CIMB Niaga" },
    { code: "DANAMON", name: "Bank Danamon" },
    { code: "PERMATA", name: "Bank Permata" },
    { code: "BTN", name: "Bank Tabungan Negara (BTN)" },
    { code: "MAYBANK", name: "Maybank Indonesia" },
    { code: "PANIN", name: "Bank Panin" },
    { code: "OCBC", name: "OCBC NISP" },
    { code: "UOB", name: "UOB Indonesia" },
    { code: "HSBC", name: "HSBC Indonesia" },
    { code: "JAGO", name: "Bank Jago" },
    { code: "SEABANK", name: "SeaBank" },
    { code: "LAINNYA", name: "Bank Lainnya" },
];

export default function BankChangePage() {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState<BankChangeRequest[]>([]);
    const [currentBank, setCurrentBank] = useState<CurrentBankInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        newBankName: "",
        newAccountNumber: "",
        newAccountHolder: "",
        newBankBranch: "",
        reason: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const res = await fetch("/api/profile/bank-change-request");
            const data = await res.json();

            if (data.success) {
                setRequests(data.data.requests);
                setCurrentBank(data.data.currentBankInfo);
            }
        } catch (err) {
            console.error(err);
            setError("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch("/api/profile/bank-change-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setShowForm(false);
                setForm({
                    newBankName: "",
                    newAccountNumber: "",
                    newAccountHolder: "",
                    newBankBranch: "",
                    reason: "",
                });
                await fetchData();
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setError(data.error?.message || "Gagal mengirim pengajuan");
            }
        } catch (err) {
            console.error(err);
            setError("Gagal mengirim pengajuan");
        } finally {
            setSubmitting(false);
        }
    }

    const hasPendingRequest = requests.some((r) => r.status === "PENDING");

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
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/profile"
                        className="mb-4 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Kembali ke Profil
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">Pengajuan Perubahan Data Bank</h1>
                    <p className="text-slate-600">
                        Ajukan perubahan data rekening bank Anda untuk keperluan payroll
                    </p>
                </div>

                {/* Success Message */}
                {success && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>Pengajuan berhasil dikirim. Mohon tunggu persetujuan dari HRD.</span>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Current Bank Info */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <CreditCard className="h-4 w-4" />
                            Data Bank Saat Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentBank?.bankName ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-slate-500">Bank</p>
                                    <p className="font-medium">{currentBank.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Nomor Rekening</p>
                                    <p className="font-medium font-mono">{currentBank.bankAccountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Atas Nama</p>
                                    <p className="font-medium">{currentBank.bankAccountHolder}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Cabang</p>
                                    <p className="font-medium">{currentBank.bankBranch || "-"}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-500">Belum ada data bank yang terdaftar</p>
                        )}
                    </CardContent>
                </Card>

                {/* Request Form or Button */}
                {!showForm ? (
                    <Card className="mb-6">
                        <CardContent className="py-6">
                            {hasPendingRequest ? (
                                <div className="text-center">
                                    <Clock className="mx-auto h-12 w-12 text-amber-500" />
                                    <p className="mt-2 font-medium text-slate-900">
                                        Anda memiliki pengajuan yang sedang diproses
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Mohon tunggu hingga pengajuan sebelumnya selesai diproses
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Button onClick={() => setShowForm(true)}>
                                        <Send className="mr-2 h-4 w-4" />
                                        Ajukan Perubahan Data Bank
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-base">Form Pengajuan</CardTitle>
                            <CardDescription>
                                Isi data bank baru yang ingin Anda gunakan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="bankName">Bank *</Label>
                                    <Select
                                        value={form.newBankName}
                                        onValueChange={(value) => setForm({ ...form, newBankName: value })}
                                    >
                                        <SelectTrigger id="bankName" className="mt-1">
                                            <SelectValue placeholder="Pilih bank" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BANK_LIST.map((bank) => (
                                                <SelectItem key={bank.code} value={bank.code}>
                                                    {bank.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="accountNumber">Nomor Rekening *</Label>
                                    <Input
                                        id="accountNumber"
                                        value={form.newAccountNumber}
                                        onChange={(e) => setForm({ ...form, newAccountNumber: e.target.value })}
                                        placeholder="Masukkan nomor rekening"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="accountHolder">Nama Pemilik Rekening *</Label>
                                    <Input
                                        id="accountHolder"
                                        value={form.newAccountHolder}
                                        onChange={(e) => setForm({ ...form, newAccountHolder: e.target.value })}
                                        placeholder="Nama sesuai buku tabungan"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="bankBranch">Cabang Bank</Label>
                                    <Input
                                        id="bankBranch"
                                        value={form.newBankBranch}
                                        onChange={(e) => setForm({ ...form, newBankBranch: e.target.value })}
                                        placeholder="Cabang bank (opsional)"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="reason">Alasan Perubahan *</Label>
                                    <Textarea
                                        id="reason"
                                        value={form.reason}
                                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                        placeholder="Jelaskan alasan perubahan data bank (min. 10 karakter)"
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="mr-2 h-4 w-4" />
                                        )}
                                        Kirim Pengajuan
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowForm(false)}
                                        disabled={submitting}
                                    >
                                        Batal
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Request History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Riwayat Pengajuan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <p className="text-center text-slate-500 py-4">
                                Belum ada riwayat pengajuan
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {requests.map((req) => (
                                    <div
                                        key={req.id}
                                        className="rounded-lg border p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">{req.newBankName}</p>
                                                <p className="text-sm text-slate-600 font-mono">
                                                    {req.newAccountNumber}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    a.n. {req.newAccountHolder}
                                                </p>
                                            </div>
                                            {getStatusBadge(req.status)}
                                        </div>
                                        <div className="mt-2 text-xs text-slate-500">
                                            Diajukan: {formatDate(req.createdAt)}
                                        </div>
                                        {req.status === "REJECTED" && req.rejectionReason && (
                                            <div className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
                                                <strong>Alasan penolakan:</strong> {req.rejectionReason}
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
