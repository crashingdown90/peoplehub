
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Users, Clock, Search, Loader2, Check, 
    ArrowLeft, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";

interface Shift {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
}

interface Employee {
    id: string;
    fullName: string;
    employeeNumber: string;
    department?: { name: string };
    defaultShiftId: string | null;
    defaultShift?: Shift | null;
}

export default function ShiftAssignmentPage() {
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);
    const [bulkUpdating, setBulkUpdating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [empRes, shiftRes] = await Promise.all([
                fetch("/api/admin/employees?limit=100"),
                fetch("/api/admin/shifts?isActive=true")
            ]);

            const empData = await empRes.json();
            const shiftData = await shiftRes.json();

            if (empData.success) {
                setEmployees(empData.data);
            }
            if (shiftData.success) {
                setShifts(shiftData.data);
            }
        } catch (err) {
            console.error(err);
            toast({
                title: "Gagal mengambil data",
                description: "Terjadi kesalahan saat memuat data karyawan atau shift.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAssignShift = async (employeeId: string, shiftId: string) => {
        const shift = shifts.find((s) => s.id === shiftId);
        const employee = employees.find((e) => e.id === employeeId);
        if (!shift || !employee) return;
        const confirmed = window.confirm(
            `Ubah shift ${employee.fullName} ke "${shift.name}"?`
        );
        if (!confirmed) return;
        setUpdating(employeeId);
        setEmployees(prev =>
            prev.map(emp =>
                emp.id === employeeId
                    ? { ...emp, defaultShiftId: shiftId, defaultShift: shift }
                    : emp
            )
        );
        toast({
            title: "Shift diperbarui (sementara)",
            description: `Shift untuk ${employee.fullName} berubah ke "${shift.name}". Belum disimpan ke database.`,
        });
        setUpdating(null);
    };

    const shiftPagiId = shifts.find((s) => s.name.toLowerCase().includes("pagi"))?.id || null;

    const filteredEmployees = employees.filter(emp => 
        emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(search.toLowerCase())
    );

    const getDefaultShiftId = () => {
        return (
            shifts.find((s) => s.name.toLowerCase().includes("pagi"))?.id ||
            shifts[0]?.id ||
            null
        );
    };

    const handleSetAllToPagi = async () => {
        const defaultShiftId = getDefaultShiftId();
        if (!defaultShiftId) {
            toast({
                title: "Shift pagi tidak ditemukan",
                description: "Buat shift pagi terlebih dahulu.",
                variant: "destructive",
            });
            return;
        }
        const confirmed = window.confirm("Set semua karyawan ke shift Pagi?");
        if (!confirmed) return;

        setBulkUpdating(true);
        const shift = shifts.find((s) => s.id === defaultShiftId) || null;
        setEmployees((prev) =>
            prev.map((emp) => ({
                ...emp,
                defaultShiftId,
                defaultShift: shift,
            }))
        );
        toast({
            title: "Berhasil (sementara)",
            description: "Semua karyawan diset ke shift Pagi. Belum disimpan ke database.",
        });
        setBulkUpdating(false);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin/shifts" className="flex items-center text-sm text-slate-500 hover:text-blue-600 transition mb-4 w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali ke Shift Management
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Penentuan Shift Karyawan</h1>
                        <p className="text-slate-500">Atur shift default untuk setiap karyawan</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSetAllToPagi} disabled={bulkUpdating || loading}>
                            {bulkUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Menyetel...
                                </>
                            ) : (
                                <>Set Semua ke Shift Pagi</>
                            )}
                        </Button>
                        <Button variant="outline" onClick={fetchData} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh Data
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Filter */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau NIK karyawan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition shadow-sm"
                    />
                </div>
            </div>

            {/* Employee List */}
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Daftar Karyawan ({filteredEmployees.length})
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                            <p className="text-slate-500 animate-pulse">Memuat data karyawan...</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="py-20 text-center">
                            <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500">Karyawan tidak ditemukan</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredEmployees.map((emp) => (
                                <div key={emp.id} className="p-4 md:p-6 hover:bg-white transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-12 w-12 rounded-full bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                                            {emp.fullName.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{emp.fullName}</h3>
                                            <p className="text-sm text-slate-500 font-mono">#{emp.employeeNumber}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="text-[10px] py-0">
                                                    {emp.department?.name || "No Dept"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                                        {shifts.map((shift) => {
                                            const inferredDefaultShiftId = emp.defaultShiftId || shiftPagiId || shifts[0]?.id;
                                            const isActive = shift.id === inferredDefaultShiftId;
                                            return (
                                                <button
                                                    key={shift.id}
                                                    onClick={() => !isActive && handleAssignShift(emp.id, shift.id)}
                                                    disabled={updating === emp.id}
                                                    className={`
                                                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
                                                        ${isActive 
                                                            ? 'bg-blue-600 text-white shadow-blue-200 ring-2 ring-blue-500 ring-offset-1' 
                                                            : 'bg-blue-50 border border-blue-200 text-slate-700 hover:border-blue-300 hover:bg-blue-100'
                                                        }
                                                        disabled:opacity-50 disabled:cursor-not-allowed
                                                    `}
                                                >
                                                    {updating === emp.id && !isActive ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                                    ) : isActive ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <Clock className="h-4 w-4 opacity-50" />
                                                    )}
                                                    {shift.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Section */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg h-fit text-blue-600">
                        <Check className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Informasi Penting</h4>
                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                            Shift default akan digunakan sebagai acuan saat karyawan melakukan absensi (clock-in) jika tidak ada jadwal khusus yang dibuat pada tanggal tersebut.
                        </p>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg h-fit text-amber-600">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-amber-900 text-sm">Ketentuan Shift</h4>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                            Perubahan shift akan langsung berlaku pada absensi hari berikutnya. Untuk perubahan hari ini yang sudah berjalan, silakan buat penyesuaian di menu Jadwal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
