"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Plus, Trash2, Loader2, Upload, X } from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

interface ReimburseItem {
    description: string;
    unitPrice: string;
    quantity: string;
    amount: string;
    date: string;
    receiptFile?: File | null;
    receiptUrl?: string;
}

interface ReimburseRequest {
    id: string;
    category: string;
    description: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: Array<{ description: string; unitPrice: number | null; quantity: number; amount: number; date: string; receiptUrl: string | null }>;
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

export default function ReimbursePage() {
    const [requests, setRequests] = useState<ReimburseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        category: "TRANSPORT",
        description: "",
    });

    const [items, setItems] = useState<ReimburseItem[]>([
        { description: "", unitPrice: "", quantity: "1", amount: "", date: "", receiptFile: null },
    ]);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        try {
            const res = await fetchWithCsrf("/api/reimburse/requests");
            const data = await res.json();
            if (data.success) {
                setRequests(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function addItem() {
        setItems([...items, { description: "", unitPrice: "", quantity: "1", amount: "", date: "", receiptFile: null }]);
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    function updateItem(index: number, field: keyof ReimburseItem, value: string | File | null) {
        const updated = [...items];
        if (field === "receiptFile") {
            updated[index].receiptFile = value as File | null;
        } else {
            (updated[index] as unknown as Record<string, string>)[field] = value as string;
        }

        // Auto-calculate amount when unitPrice or quantity changes
        if (field === "unitPrice" || field === "quantity") {
            const up = parseFloat(updated[index].unitPrice) || 0;
            const qty = parseInt(updated[index].quantity) || 1;
            updated[index].amount = (up * qty).toString();
        }

        setItems(updated);
    }

    async function uploadReceipt(file: File): Promise<string | null> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetchWithCsrf("/api/upload/receipt", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) return data.data.url;
            return null;
        } catch {
            return null;
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const validItems = items.filter((i) => i.description && i.amount && i.date);

        if (validItems.length === 0) {
            setError("Minimal 1 item reimburse");
            setSubmitting(false);
            return;
        }

        try {
            // Upload receipts first
            const itemsWithReceipts = await Promise.all(
                validItems.map(async (item) => {
                    let receiptUrl = item.receiptUrl;
                    if (item.receiptFile) {
                        receiptUrl = await uploadReceipt(item.receiptFile) || undefined;
                    }
                    return {
                        description: item.description,
                        unitPrice: parseFloat(item.unitPrice) || undefined,
                        quantity: parseInt(item.quantity) || 1,
                        amount: parseFloat(item.amount),
                        date: item.date,
                        receiptUrl,
                    };
                })
            );

            const res = await fetchWithCsrf("/api/reimburse/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, items: itemsWithReceipts }),
            });

            const data = await res.json();

            if (data.success) {
                setShowForm(false);
                setForm({ category: "TRANSPORT", description: "" });
                setItems([{ description: "", unitPrice: "", quantity: "1", amount: "", date: "", receiptFile: null }]);
                fetchRequests();
            } else {
                if (data.error?.details?.length) {
                    const messages = data.error.details.map((d: { message: string }) => d.message).join(", ");
                    setError(messages);
                } else {
                    setError(data.error?.message || "Gagal mengajukan reimburse");
                }
            }
        } catch (err) {
            console.error(err);
            setError("Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-700",
            APPROVED_MANAGER: "bg-blue-100 text-blue-700",
            APPROVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
        };
        return (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {status.replace("_", " ")}
            </span>
        );
    };

    const totalItems = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Reimburse</h1>
                        <p className="text-slate-600">Ajukan penggantian biaya</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajukan Baru
                    </Button>
                </div>

                {showForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Form Pengajuan Reimburse</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Kategori</label>
                                        <select
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        >
                                            {Object.entries(CATEGORIES).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <Input
                                        label="Deskripsi"
                                        placeholder="Jelaskan keperluan reimburse"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700">Item Reimburse</label>
                                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                            <Plus className="mr-1 h-3 w-3" /> Tambah Item
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div key={index} className="rounded-lg border border-slate-200 p-3 space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                        placeholder="Nama Item"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                                    />
                                                    <input
                                                        className="w-36 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                        type="date"
                                                        value={item.date}
                                                        onChange={(e) => updateItem(index, "date", e.target.value)}
                                                    />
                                                    {items.length > 1 && (
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 items-end">
                                                    <div className="flex-1">
                                                        <label className="mb-1 block text-xs text-slate-500">Harga Satuan</label>
                                                        <input
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                            type="number"
                                                            placeholder="Rp"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-20">
                                                        <label className="mb-1 block text-xs text-slate-500">Jumlah</label>
                                                        <input
                                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="w-36">
                                                        <label className="mb-1 block text-xs text-slate-500">Subtotal</label>
                                                        <input
                                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium"
                                                            type="number"
                                                            placeholder="Total"
                                                            value={item.amount}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                                {/* Receipt Upload */}
                                                <div className="flex items-center gap-2">
                                                    {item.receiptFile ? (
                                                        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700">
                                                            <Receipt className="h-3 w-3" />
                                                            <span className="truncate max-w-[200px]">{item.receiptFile.name}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateItem(index, "receiptFile", null)}
                                                                className="ml-1"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50">
                                                            <Upload className="h-3 w-3" />
                                                            Upload Nota
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0] || null;
                                                                    updateItem(index, "receiptFile", file);
                                                                }}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {totalItems > 0 && (
                                        <div className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-right text-sm font-semibold text-blue-800">
                                            Total: {formatCurrency(totalItems)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Ajukan
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : requests.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Receipt className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Belum ada pengajuan reimburse</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <Card key={req.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    {CATEGORIES[req.category] || req.category}
                                                </span>
                                                {getStatusBadge(req.status)}
                                            </div>
                                            <p className="mt-2 font-medium text-slate-900">{req.description}</p>
                                            <p className="mt-1 text-sm text-slate-500">{req.items.length} item</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-slate-900">{formatCurrency(req.totalAmount)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
