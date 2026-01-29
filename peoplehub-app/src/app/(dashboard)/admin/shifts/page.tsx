
"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar as CalendarIcon, Users, Clock, Edit, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

interface Shift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    _count?: {
        defaultShiftEmployees: number;
    };
}

export default function ShiftManagementPage() {
    const { toast } = useToast();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchShifts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/shifts");
            const data = await res.json();
            if (data.success) {
                setShifts(data.data);
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Gagal memuat data",
                description: "Tidak dapat mengambil data shift dari server.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    const getCsrfToken = async () => {
        const res = await fetch("/api/auth/csrf");
        const data = await res.json();
        return data.token;
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus template shift "${name}"?`)) {
            return;
        }

        try {
            const csrfToken = await getCsrfToken();
            const res = await fetch(`/api/admin/shifts/${id}`, {
                method: "DELETE",
                headers: {
                    "x-csrf-token": csrfToken
                }
            });
            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Berhasil",
                    description: `Shift "${name}" telah dihapus.`,
                });
                fetchShifts();
            } else {
                toast({
                    title: "Gagal menghapus",
                    description: data.error?.message || "Terjadi kesalahan saat menghapus shift.",
                    variant: "destructive",
                });
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Gagal",
                description: "Terjadi kesalahan koneksi.",
                variant: "destructive",
            });
        }
    };

    const totalAssigned = shifts.reduce((acc, shift) => acc + (shift._count?.defaultShiftEmployees || 0), 0);

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Shift Management</h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Kelola template shift dan penugasan jadwal karyawan
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={fetchShifts} className="h-11">
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Link href="/admin/shifts/assign">
                        <Button className="h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                            <Users className="mr-2 h-4 w-4" />
                            Atur Shift Karyawan
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card className="border-none shadow-md bg-linear-to-br from-white to-slate-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Shift Aktif</p>
                                <h3 className="text-2xl font-bold text-slate-900">{shifts.filter(s => s.isActive).length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-linear-to-br from-white to-slate-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Karyawan Terdaftar</p>
                                <h3 className="text-2xl font-bold text-slate-900">{totalAssigned}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-linear-to-br from-white to-slate-50">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <CalendarIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Periode</p>
                                <h3 className="text-2xl font-bold text-slate-900">Januari 2026</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Shift Templates Grid */}
            <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">Template Shift</h2>
                    <Button variant="ghost" className="text-blue-600 hover:text-blue-700 font-semibold" asChild>
                        <Link href="/admin/shifts/new">Tambah Template <Plus className="ml-2 h-4 w-4" /></Link>
                    </Button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-500 animate-pulse">Memuat template shift...</p>
                    </div>
                ) : shifts.length === 0 ? (
                    <Card className="border-dashed border-2 py-12 flex flex-col items-center justify-center text-center">
                        <Clock className="h-12 w-12 text-slate-200 mb-4" />
                        <p className="text-slate-500 max-w-sm mb-6">Belum ada template shift yang dikonfigurasi. Buat template sekarang untuk mulai mengatur jadwal.</p>
                        <Button asChild>
                            <Link href="/admin/shifts/new"><Plus className="mr-2 h-4 w-4" /> Buat Template Pertama</Link>
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shifts.map((shift) => (
                            <Card key={shift.id} className="border-none shadow-lg hover:shadow-xl transition-all group overflow-hidden">
                                <div className={`h-2 w-full ${shift.name === 'Pagi' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-wide">{shift.name}</h3>
                                            <div className="flex items-center gap-2 mt-2 py-1 px-3 bg-slate-100 rounded-lg w-fit">
                                                <Clock className="h-4 w-4 text-slate-500" />
                                                <span className="text-sm font-semibold text-slate-700">
                                                    {shift.startTime} - {shift.endTime}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={`${shift.name === 'Pagi' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'} border-none px-3 py-1 font-bold`}>
                                            {shift.name}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm py-2 border-b border-slate-50">
                                            <span className="text-slate-500 flex items-center gap-2"><Users className="h-4 w-4" /> Karyawan Assigned</span>
                                            <span className="font-bold text-slate-900">{shift._count?.defaultShiftEmployees || 0} orang</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Status</span>
                                            <Badge variant={shift.isActive ? "success" : "neutral"} className="px-2 py-0">
                                                {shift.isActive ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-8">
                                        <Button variant="outline" size="sm" className="flex-1 hover:bg-slate-50" asChild>
                                            <Link href={`/admin/shifts/${shift.id}/edit`}>
                                                <Edit className="h-4 w-4 mr-2" /> Edit
                                            </Link>
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
                                            onClick={() => handleDelete(shift.id, shift.name)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Multi-action Link Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="group hover:bg-blue-600 transition-all duration-300 cursor-pointer overflow-hidden relative" asChild>
                    <Link href="/admin/shifts/assign">
                        <CardContent className="p-8">
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Users className="h-40 w-40 text-black" />
                            </div>
                            <Users className="h-10 w-10 mb-4 text-blue-600 group-hover:text-white transition-colors" />
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-white mb-2">Penentuan Shift Massal</h3>
                            <p className="text-slate-500 group-hover:text-blue-100 text-sm max-w-xs">
                                Tentukan shift Pagi atau Sore untuk setiap karyawan dengan cepat dan mudah.
                            </p>
                        </CardContent>
                    </Link>
                </Card>
                <Card className="group hover:bg-emerald-600 transition-all duration-300 cursor-pointer overflow-hidden relative" asChild>
                    <Link href="/admin/shifts/calendar">
                        <CardContent className="p-8">
                            <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <CalendarIcon className="h-40 w-40 text-black" />
                            </div>
                            <CalendarIcon className="h-10 w-10 mb-4 text-emerald-600 group-hover:text-white transition-colors" />
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-white mb-2">Kalender Jadwal</h3>
                            <p className="text-slate-500 group-hover:text-emerald-50 text-sm max-w-xs">
                                Lihat visualisasi seluruh jadwal karyawan dalam format kalender mingguan atau bulanan.
                            </p>
                        </CardContent>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
