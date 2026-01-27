"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Plus, Calendar, DollarSign, Loader2 } from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

interface TravelRequest {
    id: string;
    destination: string;
    purpose: string;
    departureDate: string;
    returnDate: string;
    estimatedBudget: number;
    status: string;
    createdAt: string;
}

export default function TravelPage() {
    const [requests, setRequests] = useState<TravelRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        destination: "",
        purpose: "",
        departureDate: "",
        returnDate: "",
        estimatedBudget: "",
        transportation: "",
        accommodation: "",
        notes: "",
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        try {
            const res = await fetchWithCsrf("/api/travel/requests");
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

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const res = await fetchWithCsrf("/api/travel/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    estimatedBudget: parseFloat(form.estimatedBudget) || 0,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setShowForm(false);
                setForm({ destination: "", purpose: "", departureDate: "", returnDate: "", estimatedBudget: "", transportation: "", accommodation: "", notes: "" });
                fetchRequests();
            } else {
                setError(data.error?.message || "Gagal mengajukan perjalanan dinas");
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

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-700",
            APPROVED_MANAGER: "bg-blue-100 text-blue-700",
            APPROVED: "bg-green-100 text-green-700",
            REJECTED: "bg-red-100 text-red-700",
        };
        const labels: Record<string, string> = {
            PENDING: "Pending",
            APPROVED_MANAGER: "Manager OK",
            APPROVED: "Approved",
            REJECTED: "Rejected",
        };
        return (
            <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || "bg-gray-100"}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Perjalanan Dinas</h1>
                        <p className="text-slate-600">Kelola pengajuan perjalanan dinas Anda</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajukan Baru
                    </Button>
                </div>

                {showForm && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Form Pengajuan Perjalanan Dinas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Destinasi"
                                        placeholder="Kota / Lokasi tujuan"
                                        value={form.destination}
                                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Estimasi Biaya"
                                        type="number"
                                        placeholder="Dalam Rupiah"
                                        value={form.estimatedBudget}
                                        onChange={(e) => setForm({ ...form, estimatedBudget: e.target.value })}
                                    />
                                </div>

                                <Input
                                    label="Tujuan Perjalanan"
                                    placeholder="Jelaskan tujuan perjalanan dinas"
                                    value={form.purpose}
                                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                                    required
                                />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Tanggal Berangkat"
                                        type="date"
                                        value={form.departureDate}
                                        onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                                        required
                                    />
                                    <Input
                                        label="Tanggal Kembali"
                                        type="date"
                                        value={form.returnDate}
                                        onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Input
                                        label="Transportasi"
                                        placeholder="Pesawat, Kereta, Mobil"
                                        value={form.transportation}
                                        onChange={(e) => setForm({ ...form, transportation: e.target.value })}
                                    />
                                    <Input
                                        label="Akomodasi"
                                        placeholder="Nama hotel atau tempat menginap"
                                        value={form.accommodation}
                                        onChange={(e) => setForm({ ...form, accommodation: e.target.value })}
                                    />
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
                            <Plane className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Belum ada pengajuan perjalanan dinas</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => (
                            <Card key={req.id}>
                                <CardContent className="py-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900">{req.destination}</h3>
                                                {getStatusBadge(req.status)}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600">{req.purpose}</p>

                                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {formatDate(req.departureDate)} - {formatDate(req.returnDate)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-4 w-4" />
                                                    {formatCurrency(req.estimatedBudget)}
                                                </div>
                                            </div>
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
