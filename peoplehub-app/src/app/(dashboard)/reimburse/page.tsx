"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Receipt, Plus, Trash2, Loader2 } from "lucide-react";

interface ReimburseItem {
    description: string;
    amount: string;
    date: string;
}

interface ReimburseRequest {
    id: string;
    category: string;
    description: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: Array<{ description: string; amount: number; date: string }>;
}

const CATEGORIES = ["Transport", "Meals", "Accommodation", "Equipment", "Other"];

export default function ReimbursePage() {
    const [requests, setRequests] = useState<ReimburseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        category: "Transport",
        description: "",
    });

    const [items, setItems] = useState<ReimburseItem[]>([
        { description: "", amount: "", date: "" },
    ]);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        try {
            const res = await fetch("/api/reimburse/requests");
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
        setItems([...items, { description: "", amount: "", date: "" }]);
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
    }

    function updateItem(index: number, field: keyof ReimburseItem, value: string) {
        const updated = [...items];
        updated[index][field] = value;
        setItems(updated);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        const validItems = items
            .filter((i) => i.description && i.amount && i.date)
            .map((i) => ({ ...i, amount: parseFloat(i.amount) }));

        if (validItems.length === 0) {
            setError("Minimal 1 item reimburse");
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch("/api/reimburse/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, items: validItems }),
            });

            const data = await res.json();

            if (data.success) {
                setShowForm(false);
                setForm({ category: "Transport", description: "" });
                setItems([{ description: "", amount: "", date: "" }]);
                fetchRequests();
            } else {
                setError(data.error?.message || "Gagal mengajukan reimburse");
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
                                            {CATEGORIES.map((c) => (
                                                <option key={c} value={c}>{c}</option>
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

                                    <div className="space-y-2">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                    placeholder="Keterangan"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, "description", e.target.value)}
                                                />
                                                <input
                                                    className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                                    type="number"
                                                    placeholder="Jumlah"
                                                    value={item.amount}
                                                    onChange={(e) => updateItem(index, "amount", e.target.value)}
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
                                        ))}
                                    </div>

                                    {totalItems > 0 && (
                                        <div className="mt-2 text-right text-sm font-medium text-slate-700">
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
                                                    {req.category}
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
