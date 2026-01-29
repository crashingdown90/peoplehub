"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Download,
    Loader2,
    CreditCard,
    Calendar,
    User,
    Building2,
    BadgeCheck,
} from "lucide-react";

interface PayslipDetail {
    id: string;
    period: string;
    periodLabel: string;
    employee: {
        fullName: string;
        employeeNumber: string;
        nik?: string;
        npwp?: string;
        department?: { name?: string };
        position?: { name?: string };
        branch?: { name?: string };
    };
    earnings: {
        basicSalary: number;
        allowances: Record<string, number>;
        overtimeAmount: number;
        bonus: number;
    };
    deductions: {
        lateDeduction: number;
        absentDeduction: number;
        taxDeduction: number;
        bpjsKesehatan: number;
        bpjsKetenagakerjaan: number;
        otherDeductions: Record<string, number>;
    };
    summary: {
        grossSalary: number;
        totalDeductions: number;
        netSalary: number;
    };
    attendance: {
        workDays: number;
        presentDays: number;
        lateDays: number;
        absentDays: number;
        leaveDays: number;
        overtimeHours: number;
    };
    publishedAt: string;
    notes?: string | null;
}

export default function PayslipDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<PayslipDetail | null>(null);

    useEffect(() => {
        async function fetchDetail() {
            try {
                const res = await fetch(`/api/payroll/payslips/${id}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchDetail();
    }, [id]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const openPdf = () => {
        window.open(`/api/payroll/payslips/${id}/pdf`, "_blank");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <p className="text-slate-500">Slip gaji tidak ditemukan.</p>
            </div>
        );
    }

    const allowances = Object.entries(data.earnings.allowances || {});
    const otherDeductions = Object.entries(data.deductions.otherDeductions || {});

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Button variant="ghost" onClick={() => router.push("/payslips")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                    </Button>
                    <Button onClick={openPdf}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white">
                                    <CreditCard className="h-7 w-7" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">Slip Gaji</h1>
                                    <p className="text-slate-600">{data.periodLabel}</p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right">
                                <p className="text-xs text-slate-500">Gaji Bersih</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.netSalary)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Data Karyawan</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start gap-3">
                            <User className="mt-1 h-4 w-4 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Nama</p>
                                <p className="font-medium text-slate-900">{data.employee.fullName}</p>
                                <p className="text-xs text-slate-400">#{data.employee.employeeNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Building2 className="mt-1 h-4 w-4 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Departemen</p>
                                <p className="font-medium text-slate-900">{data.employee.department?.name || "-"}</p>
                                <p className="text-xs text-slate-400">{data.employee.position?.name || "-"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <BadgeCheck className="mt-1 h-4 w-4 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">NIK / NPWP</p>
                                <p className="font-medium text-slate-900">{data.employee.nik || "-"}</p>
                                <p className="text-xs text-slate-400">{data.employee.npwp || "-"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Calendar className="mt-1 h-4 w-4 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Diterbitkan</p>
                                <p className="font-medium text-slate-900">{formatDate(data.publishedAt)}</p>
                                <p className="text-xs text-slate-400">{data.employee.branch?.name || "-"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Pendapatan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Gaji Pokok</span>
                                <span className="font-medium">{formatCurrency(data.earnings.basicSalary)}</span>
                            </div>
                            {allowances.map(([name, value]) => (
                                <div key={name} className="flex justify-between text-sm">
                                    <span>{name}</span>
                                    <span className="font-medium">{formatCurrency(value)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm">
                                <span>Lembur</span>
                                <span className="font-medium">{formatCurrency(data.earnings.overtimeAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Bonus</span>
                                <span className="font-medium">{formatCurrency(data.earnings.bonus)}</span>
                            </div>
                            <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
                                <span>Total Pendapatan</span>
                                <span className="text-green-600">{formatCurrency(data.summary.grossSalary)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Potongan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Potongan Terlambat</span>
                                <span className="font-medium text-red-600">-{formatCurrency(data.deductions.lateDeduction)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Potongan Absen</span>
                                <span className="font-medium text-red-600">-{formatCurrency(data.deductions.absentDeduction)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>PPh 21</span>
                                <span className="font-medium text-red-600">-{formatCurrency(data.deductions.taxDeduction)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>BPJS Kesehatan</span>
                                <span className="font-medium text-red-600">-{formatCurrency(data.deductions.bpjsKesehatan)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>BPJS Ketenagakerjaan</span>
                                <span className="font-medium text-red-600">-{formatCurrency(data.deductions.bpjsKetenagakerjaan)}</span>
                            </div>
                            {otherDeductions.map(([name, value]) => (
                                <div key={name} className="flex justify-between text-sm">
                                    <span>{name}</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(value)}</span>
                                </div>
                            ))}
                            <div className="mt-3 flex justify-between border-t pt-3 text-sm font-semibold">
                                <span>Total Potongan</span>
                                <span className="text-red-600">-{formatCurrency(data.summary.totalDeductions)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ringkasan Kehadiran</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="text-slate-500">Hari Kerja</p>
                            <p className="text-lg font-semibold text-slate-900">{data.attendance.workDays} hari</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="text-slate-500">Hadir</p>
                            <p className="text-lg font-semibold text-slate-900">{data.attendance.presentDays} hari</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="text-slate-500">Terlambat</p>
                            <p className="text-lg font-semibold text-slate-900">{data.attendance.lateDays} hari</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="text-slate-500">Tidak Hadir</p>
                            <p className="text-lg font-semibold text-slate-900">{data.attendance.absentDays} hari</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="text-slate-500">Cuti</p>
                            <p className="text-lg font-semibold text-slate-900">{data.attendance.leaveDays} hari</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-3 text-sm">
                            <p className="text-slate-500">Lembur</p>
                            <p className="text-lg font-semibold text-slate-900">{data.attendance.overtimeHours} jam</p>
                        </div>
                    </CardContent>
                </Card>

                {data.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Catatan</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-600">
                            {data.notes}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
