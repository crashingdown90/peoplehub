"use client";

// @ai:cx - Reimburse request detail page (employee)

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Receipt } from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

interface ReimburseItem {
    description: string;
    unitPrice: number | null;
    quantity: number;
    amount: number;
    date: string;
    receiptUrl: string | null;
}

interface ReimburseRequest {
    id: string;
    category: string;
    description: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: ReimburseItem[];
}

const CATEGORIES: Record<string, string> = {
    MEDICAL: "Kesehatan",
    TRANSPORT: "Transportasi",
    COMMUNICATION: "Komunikasi",
    MEALS: "Makan",
    OFFICE_SUPPLIES: "Perlengkapan Kantor",
    TRAINING: "Pelatihan",
    PARKING: "Parkir",
    OTHER: "Lainnya",
};

export default function ReimburseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const [data, setData] = useState<ReimburseRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const { id } = await params;
                const res = await fetchWithCsrf(`/api/reimburse/requests/${id}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                } else {
                    setError(json.error?.message || "Gagal memuat detail reimburse");
                }
            } catch (err) {
                console.error(err);
                setError("Gagal memuat detail reimburse");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-700",
            APPROVED_MANAGER: "bg-blue-100 text-blue-700",
            APPROVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
            CANCELLED: "bg-gray-100 text-gray-700",
        };
        return (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {status.replace("_", " ")}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 md:p-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-4">
                        <Link href="/reimburse">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Button>
                        </Link>
                    </div>
                    <Card>
                        <CardContent className="py-10 text-center text-slate-600">
                            {error || "Data tidak ditemukan"}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-4 flex items-center justify-between">
                    <Link href="/reimburse">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                        </Button>
                    </Link>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Receipt className="h-5 w-5" /> Detail Reimburse
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                {CATEGORIES[data.category] || data.category}
                            </span>
                            {getStatusBadge(data.status)}
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500">Kategori</p>
                                <p className="font-medium text-slate-900">{CATEGORIES[data.category] || data.category}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Tanggal Pengajuan</p>
                                <p className="font-medium text-slate-900">{formatDate(data.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Deskripsi</p>
                                <p className="font-medium text-slate-900">{data.description}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Total</p>
                                <p className="font-semibold text-slate-900">{formatCurrency(data.totalAmount)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {data.items.map((item, idx) => (
                        <Card key={`${data.id}-${idx}`}>
                            <CardContent className="py-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900">{item.description}</p>
                                        <p className="text-sm text-slate-500">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {item.receiptUrl ? (
                                        <div className="overflow-hidden rounded-lg border border-slate-200">
                                            <img
                                                src={item.receiptUrl}
                                                alt={`Nota ${item.description}`}
                                                className="w-full max-h-80 object-contain bg-slate-50"
                                            />
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                                            Nota belum diunggah
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
