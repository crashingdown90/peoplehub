// @ai:ag - Late Stats Card showing late attendance statistics

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, Clock, DollarSign } from "lucide-react";

interface LateStatsCardProps {
    totalLateCount: number;
    totalLateMinutes: number;
    penaltyAmount: number;
    period: string; // e.g., "Bulan Ini", "Minggu Ini"
    trend?: "up" | "down" | "stable";
}

export function LateStatsCard({
    totalLateCount,
    totalLateMinutes,
    penaltyAmount,
    period,
    trend = "stable",
}: LateStatsCardProps) {
    const avgLateMinutes = totalLateCount > 0
        ? Math.round(totalLateMinutes / totalLateCount)
        : 0;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getTrendColor = () => {
        if (trend === "down") return "text-green-600";
        if (trend === "up") return "text-red-600";
        return "text-blue-600";
    };

    const getTrendIcon = () => {
        if (trend === "down") {
            return <TrendingUp className="h-4 w-4 rotate-180 text-green-600" />;
        }
        if (trend === "up") {
            return <TrendingUp className="h-4 w-4 text-red-600" />;
        }
        return <div className="h-1 w-4 bg-blue-600" />;
    };

    return (
        <Card className={totalLateCount > 0 ? "border-amber-200" : ""}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${totalLateCount > 0 ? "bg-amber-100" : "bg-green-100"}`}>
                            <Clock className={`h-5 w-5 ${totalLateCount > 0 ? "text-amber-600" : "text-green-600"}`} />
                        </div>
                        Statistik Keterlambatan
                    </CardTitle>
                    <div className="flex items-center gap-1 text-xs">
                        {getTrendIcon()}
                        <span className={getTrendColor()}>
                            {trend === "down" && "Membaik"}
                            {trend === "up" && "Meningkat"}
                            {trend === "stable" && "Stabil"}
                        </span>
                    </div>
                </div>
                <p className="text-sm text-slate-500">{period}</p>
            </CardHeader>

            <CardContent className="space-y-4">
                {totalLateCount === 0 ? (
                    /* No Late Record */
                    <div className="text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-green-700">Sangat Baik!</p>
                        <p className="text-xs text-green-600 mt-1">
                            Tidak ada keterlambatan {period.toLowerCase()}
                        </p>
                    </div>
                ) : (
                    /* Late Stats */
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Total Late Days */}
                            <div className="text-center p-3 bg-amber-50 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-amber-600">{totalLateCount}</p>
                                <p className="text-xs text-amber-700 mt-1">Hari</p>
                            </div>

                            {/* Total Late Minutes */}
                            <div className="text-center p-3 bg-amber-50 rounded-lg">
                                <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-amber-600">{totalLateMinutes}</p>
                                <p className="text-xs text-amber-700 mt-1">Menit</p>
                            </div>

                            {/* Average Late */}
                            <div className="text-center p-3 bg-amber-50 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                <p className="text-2xl font-bold text-amber-600">{avgLateMinutes}</p>
                                <p className="text-xs text-amber-700 mt-1">Rata-rata</p>
                            </div>
                        </div>

                        {/* Penalty Amount */}
                        {penaltyAmount > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <DollarSign className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-red-700">
                                            Total Potongan Gaji
                                        </p>
                                        <p className="text-2xl font-bold text-red-600 mt-1">
                                            {formatCurrency(penaltyAmount)}
                                        </p>
                                        <p className="text-xs text-red-600 mt-2">
                                            Potongan akan diterapkan pada gaji bulan ini
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warning Message */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-amber-900">
                                    <p className="font-medium mb-1">Perhatian</p>
                                    {totalLateCount >= 5 ? (
                                        <p>
                                            Anda sudah terlambat {totalLateCount} kali {period.toLowerCase()}.
                                            Keterlambatan berulang dapat berdampak pada evaluasi kinerja Anda.
                                        </p>
                                    ) : (
                                        <p>
                                            Usahakan untuk selalu hadir tepat waktu untuk menghindari potongan gaji
                                            dan menjaga record kehadiran yang baik.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-700 mb-2">
                                💡 Tips Menghindari Keterlambatan:
                            </p>
                            <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside pl-2">
                                <li>Berangkat 15-30 menit lebih awal</li>
                                <li>Persiapkan kebutuhan dari malam sebelumnya</li>
                                <li>Gunakan alarm pengingat</li>
                                <li>Cek kondisi lalu lintas sebelum berangkat</li>
                            </ul>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
