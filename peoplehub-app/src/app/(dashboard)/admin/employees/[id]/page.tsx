"use client";

// @ai:cx - Employee detail page with document viewing

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Building, Briefcase, Mail, Calendar,
    Clock, CreditCard, ArrowLeft, Loader2,
    FileImage, X, Pencil
} from "lucide-react";
import Image from "next/image";

interface EmployeeDetail {
    id: string;
    employeeNumber: string;
    fullName: string;
    nik: string;
    npwp: string;
    phone: string;
    address: string;
    employmentType: string;
    workMode: string;
    status: string;
    startDate: string;
    branch?: { name: string };
    department?: { name: string };
    position?: { name: string };
    manager?: { fullName: string; employeeNumber: string };
    user?: {
        email: string;
        role: string;
        status: string;
        photoUrl?: string | null;
        ktpPhotoUrl?: string | null;
    };
    attendances: Array<{ attendanceDate: string; status: string; clockIn: string; clockOut: string }>;
    leaveBalances: Array<{ leaveType: { name: string }; remainingBalance: number }>;
    payslips: Array<{ period: string; netSalary: number }>;
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [photoModal, setPhotoModal] = useState<string | null>(null);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const res = await fetch(`/api/admin/employees/${id}`);
                const data = await res.json();
                if (data.success) {
                    setEmployee(data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployee();
    }, [id]);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: "bg-green-100 text-green-700",
            INACTIVE: "bg-yellow-100 text-yellow-700",
            TERMINATED: "bg-red-100 text-red-700",
            PRESENT: "bg-green-100 text-green-700",
            LATE: "bg-orange-100 text-orange-700",
            ABSENT: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-slate-100";
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-slate-600">Karyawan tidak ditemukan</p>
            </div>
        );
    }

    const photoUrl = employee.user?.photoUrl;
    const ktpPhotoUrl = employee.user?.ktpPhotoUrl;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-4 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                    <Button onClick={() => router.push(`/admin/employees/${id}/edit`)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Karyawan
                    </Button>
                </div>

                {/* Header */}
                <Card className="mb-6">
                    <CardContent className="py-6">
                        <div className="flex items-start gap-6">
                            {/* Profile Photo */}
                            <div
                                className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-lg ${photoUrl ? "cursor-pointer" : ""}`}
                                onClick={() => photoUrl && setPhotoModal(photoUrl)}
                            >
                                {photoUrl ? (
                                    <Image
                                        src={photoUrl}
                                        alt={employee.fullName}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-3xl font-bold text-white">
                                        {employee.fullName.slice(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-slate-900">{employee.fullName}</h1>
                                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(employee.status)}`}>
                                        {employee.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-slate-500">#{employee.employeeNumber}</p>

                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                                    {employee.position && (
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-slate-400" />
                                            {employee.position.name}
                                        </div>
                                    )}
                                    {employee.department && (
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-slate-400" />
                                            {employee.department.name}
                                        </div>
                                    )}
                                    {employee.user?.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-slate-400" />
                                            {employee.user.email}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Personal Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Pribadi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">NIK</span><span>{employee.nik || "-"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">NPWP</span><span>{employee.npwp || "-"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Phone</span><span>{employee.phone || "-"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Alamat</span><span className="text-right max-w-[200px]">{employee.address || "-"}</span></div>
                        </CardContent>
                    </Card>

                    {/* Employment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Pekerjaan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Tipe</span><span>{employee.employmentType}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Mode Kerja</span><span>{employee.workMode || "-"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Bergabung</span><span>{formatDate(employee.startDate)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Cabang</span><span>{employee.branch?.name || "-"}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Atasan</span><span>{employee.manager?.fullName || "-"}</span></div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileImage className="h-4 w-4" /> Dokumen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Profile Photo */}
                                <div>
                                    <p className="mb-2 text-xs font-medium text-slate-500">Foto Profil</p>
                                    {photoUrl ? (
                                        <div
                                            className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-lg border border-slate-200"
                                            onClick={() => setPhotoModal(photoUrl)}
                                        >
                                            <Image
                                                src={photoUrl}
                                                alt="Foto Profil"
                                                fill
                                                className="object-cover hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                                            <span className="text-xs text-slate-400">Tidak ada</span>
                                        </div>
                                    )}
                                </div>

                                {/* KTP Photo */}
                                <div>
                                    <p className="mb-2 text-xs font-medium text-slate-500">Foto KTP</p>
                                    {ktpPhotoUrl ? (
                                        <div
                                            className="relative aspect-[1.6/1] w-full cursor-pointer overflow-hidden rounded-lg border border-slate-200"
                                            onClick={() => setPhotoModal(ktpPhotoUrl)}
                                        >
                                            <Image
                                                src={ktpPhotoUrl}
                                                alt="Foto KTP"
                                                fill
                                                className="object-cover hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex aspect-[1.6/1] w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
                                            <span className="text-xs text-slate-400">Tidak ada</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Leave Balances */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calendar className="h-4 w-4" /> Saldo Cuti
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {employee.leaveBalances.length === 0 ? (
                                    <p className="text-sm text-slate-500">Tidak ada saldo cuti</p>
                                ) : (
                                    employee.leaveBalances.map((bal, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                            <span className="text-sm">{bal.leaveType.name}</span>
                                            <span className="font-medium">{bal.remainingBalance} hari</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Payslips */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="h-4 w-4" /> Slip Gaji Terakhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {employee.payslips.length === 0 ? (
                                    <p className="text-sm text-slate-500">Tidak ada slip gaji</p>
                                ) : (
                                    employee.payslips.map((slip, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                            <span className="text-sm">{slip.period}</span>
                                            <span className="font-medium text-green-600">{formatCurrency(slip.netSalary)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Attendance */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Clock className="h-4 w-4" /> Kehadiran Terakhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b text-left text-slate-500">
                                            <th className="pb-2">Tanggal</th>
                                            <th className="pb-2">Status</th>
                                            <th className="pb-2">Clock In</th>
                                            <th className="pb-2">Clock Out</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employee.attendances.length === 0 ? (
                                            <tr><td colSpan={4} className="py-4 text-center text-slate-500">Tidak ada data</td></tr>
                                        ) : (
                                            employee.attendances.map((att, i) => (
                                                <tr key={i} className="border-b last:border-0">
                                                    <td className="py-2">{formatDate(att.attendanceDate)}</td>
                                                    <td className="py-2">
                                                        <span className={`rounded px-2 py-0.5 text-xs ${getStatusColor(att.status)}`}>{att.status}</span>
                                                    </td>
                                                    <td className="py-2">{att.clockIn ? new Date(att.clockIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                                                    <td className="py-2">{att.clockOut ? new Date(att.clockOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Photo Modal */}
            {photoModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setPhotoModal(null)}
                >
                    <button
                        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                        onClick={() => setPhotoModal(null)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-lg">
                        <Image
                            src={photoModal}
                            alt="Document"
                            width={800}
                            height={600}
                            className="object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
