"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Download, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Payslip {
    id: string;
    period: string;
    periodFormatted: string;
    netSalary: number;
    grossSalary: number;
    totalDeductions: number;
    publishedAt: string;
}

export default function PayslipsPage() {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayslips();
    }, []);

    async function fetchPayslips() {
        try {
            const res = await fetch("/api/payroll/payslips");
            const data = await res.json();
            if (data.success) {
                setPayslips(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const openPdf = (id: string) => {
        window.open(`/api/payroll/payslips/${id}/pdf`, "_blank");
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
            <div className="mx-auto max-w-4xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Slip Gaji</h1>
                    <p className="text-slate-600">Lihat riwayat slip gaji Anda</p>
                </div>

                {payslips.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <CreditCard className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Belum ada slip gaji yang dipublikasikan</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {payslips.map((slip) => (
                            <Card key={slip.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex items-center">
                                        <div className="flex h-24 w-24 items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                                            <CreditCard className="h-10 w-10 text-white" />
                                        </div>
                                        <div className="flex flex-1 items-center justify-between p-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{slip.periodFormatted}</h3>
                                                <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                                                    <Calendar className="h-3 w-3" />
                                                    Diterbitkan: {formatDate(slip.publishedAt)}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500">Gaji Bersih</p>
                                                    <p className="text-xl font-bold text-green-600">{formatCurrency(slip.netSalary)}</p>
                                                </div>

                                                <Button variant="outline" onClick={() => openPdf(slip.id)}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    Lihat PDF
                                                </Button>
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
