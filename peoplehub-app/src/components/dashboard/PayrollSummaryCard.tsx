// @ai:ag - Payroll Summary Card showing salary information

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Download, Eye } from "lucide-react";

interface PayrollSummaryCardProps {
    currentMonth: {
        month: string;
        year: number;
        grossSalary: number;
        deductions: number;
        netSalary: number;
        status: "PENDING" | "PROCESSED" | "PAID";
    };
    lastPayment?: {
        date: string;
        amount: number;
    };
    onViewDetail?: () => void;
    onDownloadSlip?: () => void;
}

export function PayrollSummaryCard({
    currentMonth,
    lastPayment,
    onViewDetail,
    onDownloadSlip,
}: PayrollSummaryCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PAID":
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded">
                        Dibayar
                    </span>
                );
            case "PROCESSED":
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded">
                        Diproses
                    </span>
                );
            case "PENDING":
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded">
                        Menunggu
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        Gaji {currentMonth.month} {currentMonth.year}
                    </CardTitle>
                    {getStatusBadge(currentMonth.status)}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Main Amount */}
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border">
                    <p className="text-sm text-slate-600 mb-1">Gaji Bersih</p>
                    <p className="text-3xl font-bold text-slate-900">
                        {formatCurrency(currentMonth.netSalary)}
                    </p>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Gaji Kotor</span>
                        <span className="font-medium text-slate-900">
                            {formatCurrency(currentMonth.grossSalary)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Potongan</span>
                        <span className="font-medium text-red-600">
                            -{formatCurrency(currentMonth.deductions)}
                        </span>
                    </div>

                    {lastPayment && (
                        <>
                            <div className="pt-2 border-t" />
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Pembayaran Terakhir</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600">
                                        {new Date(lastPayment.date).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </span>
                                    <span className="text-sm font-semibold text-green-600">
                                        {formatCurrency(lastPayment.amount)}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                    {onViewDetail && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onViewDetail}
                            className="flex-1"
                        >
                            <Eye className="mr-2 h-3 w-3" />
                            Detail
                        </Button>
                    )}
                    {onDownloadSlip && currentMonth.status === "PAID" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDownloadSlip}
                            className="flex-1"
                        >
                            <Download className="mr-2 h-3 w-3" />
                            Slip Gaji
                        </Button>
                    )}
                </div>

                {/* Info */}
                {currentMonth.status === "PENDING" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-900">
                            Gaji akan diproses pada tanggal 25 setiap bulan
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
