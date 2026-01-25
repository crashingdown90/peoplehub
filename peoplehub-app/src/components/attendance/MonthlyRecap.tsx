// @ai:ag - Monthly Recap component with charts and statistics

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MonthlyStats {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    totalWorkHours: number;
    totalLateMinutes: number;
    attendanceRate: number; // percentage
}

interface MonthlyRecapProps {
    stats: MonthlyStats;
    monthName: string;
    year: number;
    onExport?: () => void;
}

export function MonthlyRecap({ stats, monthName, year, onExport }: MonthlyRecapProps) {
    const attendancePercentage = stats.attendanceRate;
    const avgWorkHours = stats.presentDays > 0
        ? (stats.totalWorkHours / stats.presentDays).toFixed(1)
        : "0";

    const getTrend = () => {
        // This would compare with previous month in real implementation
        const trend = attendancePercentage >= 95 ? "up" : attendancePercentage >= 85 ? "stable" : "down";
        return trend;
    };

    const trend = getTrend();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg">Rekap Bulanan</CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            {monthName} {year}
                        </p>
                    </div>
                    {onExport && (
                        <Button variant="outline" size="sm" onClick={onExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Attendance Rate Circle */}
                <div className="flex items-center justify-center">
                    <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                            {/* Background circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-slate-200"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 56}`}
                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - attendancePercentage / 100)}`}
                                className={`${attendancePercentage >= 95 ? "text-green-500" :
                                        attendancePercentage >= 85 ? "text-blue-500" :
                                            attendancePercentage >= 75 ? "text-amber-500" :
                                                "text-red-500"
                                    }`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-slate-900">
                                {attendancePercentage}%
                            </span>
                            <span className="text-xs text-slate-500 mt-1">Kehadiran</span>
                        </div>
                    </div>
                </div>

                {/* Trend Indicator */}
                <div className="flex items-center justify-center gap-2">
                    {trend === "up" && (
                        <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">Meningkat</span>
                        </div>
                    )}
                    {trend === "down" && (
                        <div className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-medium">Menurun</span>
                        </div>
                    )}
                    {trend === "stable" && (
                        <div className="flex items-center gap-1 text-blue-600">
                            <Minus className="h-4 w-4" />
                            <span className="text-sm font-medium">Stabil</span>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-sm text-green-700 mb-1">Hadir Tepat Waktu</p>
                        <p className="text-2xl font-bold text-green-600">
                            {stats.presentDays - stats.lateDays}
                        </p>
                        <p className="text-xs text-green-600 mt-1">hari</p>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-sm text-amber-700 mb-1">Terlambat</p>
                        <p className="text-2xl font-bold text-amber-600">{stats.lateDays}</p>
                        <p className="text-xs text-amber-600 mt-1">hari</p>
                    </div>

                    <div className="bg-red-50 rounded-lg p-3">
                        <p className="text-sm text-red-700 mb-1">Tidak Hadir</p>
                        <p className="text-2xl font-bold text-red-600">{stats.absentDays}</p>
                        <p className="text-xs text-red-600 mt-1">hari</p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-700 mb-1">Cuti</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.leaveDays}</p>
                        <p className="text-xs text-blue-600 mt-1">hari</p>
                    </div>
                </div>

                {/* Work Summary */}
                <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Total Jam Kerja</span>
                        <span className="text-sm font-bold text-slate-900">{stats.totalWorkHours} jam</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Rata-rata Jam Kerja</span>
                        <span className="text-sm font-bold text-slate-900">{avgWorkHours} jam/hari</span>
                    </div>

                    {stats.totalLateMinutes > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">Total Keterlambatan</span>
                            <span className="text-sm font-bold text-amber-600">
                                {Math.floor(stats.totalLateMinutes / 60)}j {stats.totalLateMinutes % 60}m
                            </span>
                        </div>
                    )}
                </div>

                {/* Performance Message */}
                <div className={`rounded-lg p-4 ${attendancePercentage >= 95 ? "bg-green-50 border border-green-200" :
                        attendancePercentage >= 85 ? "bg-blue-50 border border-blue-200" :
                            attendancePercentage >= 75 ? "bg-amber-50 border border-amber-200" :
                                "bg-red-50 border border-red-200"
                    }`}>
                    <p className={`text-sm font-medium ${attendancePercentage >= 95 ? "text-green-700" :
                            attendancePercentage >= 85 ? "text-blue-700" :
                                attendancePercentage >= 75 ? "text-amber-700" :
                                    "text-red-700"
                        }`}>
                        {attendancePercentage >= 95 && "Kinerja Sangat Baik!"}
                        {attendancePercentage >= 85 && attendancePercentage < 95 && "Kinerja Baik"}
                        {attendancePercentage >= 75 && attendancePercentage < 85 && "Perlu Peningkatan"}
                        {attendancePercentage < 75 && "Perhatian Khusus Diperlukan"}
                    </p>
                    <p className={`text-xs mt-1 ${attendancePercentage >= 95 ? "text-green-600" :
                            attendancePercentage >= 85 ? "text-blue-600" :
                                attendancePercentage >= 75 ? "text-amber-600" :
                                    "text-red-600"
                        }`}>
                        {attendancePercentage >= 95 && "Tingkat kehadiran Anda sangat baik. Pertahankan!"}
                        {attendancePercentage >= 85 && attendancePercentage < 95 && "Tingkat kehadiran Anda baik, namun bisa ditingkatkan."}
                        {attendancePercentage >= 75 && attendancePercentage < 85 && "Tingkat kehadiran Anda perlu ditingkatkan."}
                        {attendancePercentage < 75 && "Tingkat kehadiran Anda rendah. Segera perbaiki untuk menghindari sanksi."}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
