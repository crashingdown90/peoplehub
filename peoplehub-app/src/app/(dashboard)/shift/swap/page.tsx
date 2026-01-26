"use client";

// @ai:cx - Shift swap request page

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowLeftRight, Calendar, Clock, User } from "lucide-react";

interface SwapRequest {
    id: string;
    targetEmployee: string;
    myShiftDate: string;
    myShiftTime: string;
    targetShiftDate: string;
    targetShiftTime: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

const statusStyles = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
};

const statusLabels = {
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
};

export default function ShiftSwapPage() {
    const router = useRouter();
    const [requests] = useState<SwapRequest[]>([]);
    const [showForm, setShowForm] = useState(false);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

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
                            <CardDescription>Pilih shift yang ingin ditukar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                <p className="text-sm text-amber-700">
                                    <strong>Catatan:</strong> Fitur tukar shift sedang dalam pengembangan.
                                    Silakan hubungi HRD untuk mengajukan tukar shift secara manual.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Shift Saya
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        disabled
                                    >
                                        <option>Pilih shift...</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Tukar dengan
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        disabled
                                    >
                                        <option>Pilih karyawan...</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Alasan
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    placeholder="Jelaskan alasan pertukaran shift..."
                                    disabled
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowForm(false)}>
                                    Batal
                                </Button>
                                <Button disabled>Ajukan Tukar Shift</Button>
                            </div>
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
                                                    {request.targetEmployee}
                                                </span>
                                            </div>
                                            <span
                                                className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusStyles[request.status]}`}
                                            >
                                                {statusLabels[request.status]}
                                            </span>
                                        </div>

                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                            <div className="rounded-lg bg-slate-50 p-3">
                                                <p className="text-xs text-slate-500">Shift Saya</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium">
                                                        {formatDate(request.myShiftDate)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm">{request.myShiftTime}</span>
                                                </div>
                                            </div>
                                            <div className="rounded-lg bg-blue-50 p-3">
                                                <p className="text-xs text-slate-500">Shift Tujuan</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-medium">
                                                        {formatDate(request.targetShiftDate)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm">{request.targetShiftTime}</span>
                                                </div>
                                            </div>
                                        </div>
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
