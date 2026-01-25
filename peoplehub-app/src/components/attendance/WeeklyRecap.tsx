// @ai:ag - Weekly Recap component showing 7-day attendance summary

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, AlertCircle } from "lucide-react";

interface DayAttendance {
    date: string;
    dayName: string;
    status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "HOLIDAY" | "WEEKEND";
    clockIn?: string;
    clockOut?: string;
    workHours?: number;
    lateMinutes?: number;
}

interface WeeklyRecapProps {
    weekData: DayAttendance[];
    totalWorkHours: number;
    lateCount: number;
    presentCount: number;
}

export function WeeklyRecap({
    weekData,
    totalWorkHours,
    lateCount,
    presentCount,
}: WeeklyRecapProps) {
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PRESENT":
                return <Badge className="bg-green-100 text-green-700 border-green-200">Hadir</Badge>;
            case "LATE":
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Terlambat</Badge>;
            case "ABSENT":
                return <Badge variant="destructive">Tidak Hadir</Badge>;
            case "LEAVE":
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Cuti</Badge>;
            case "HOLIDAY":
                return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Libur</Badge>;
            case "WEEKEND":
                return <Badge variant="secondary">Akhir Pekan</Badge>;
            default:
                return null;
        }
    };

    const averageWorkHours = presentCount > 0 ? (totalWorkHours / presentCount).toFixed(1) : "0";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Rekap Minggu Ini</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{presentCount}</p>
                        <p className="text-xs text-green-700 mt-1">Hari Hadir</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{totalWorkHours}j</p>
                        <p className="text-xs text-blue-700 mt-1">Total Jam Kerja</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
                        <p className="text-xs text-amber-700 mt-1">Hari Terlambat</p>
                    </div>
                </div>

                {/* Average Work Hours */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Rata-rata Jam Kerja</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{averageWorkHours} jam/hari</span>
                </div>

                {/* Daily Breakdown */}
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Detail Harian:</p>
                    <div className="space-y-2">
                        {weekData.map((day) => (
                            <div
                                key={day.date}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-center min-w-[60px]">
                                        <p className="text-xs text-slate-500">{day.dayName}</p>
                                        <p className="text-sm font-medium text-slate-900">{formatDate(day.date)}</p>
                                    </div>
                                    {getStatusBadge(day.status)}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-slate-600">
                                    {day.clockIn && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            <span>{formatTime(day.clockIn)}</span>
                                            {day.clockOut && (
                                                <>
                                                    <span>-</span>
                                                    <span>{formatTime(day.clockOut)}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {day.workHours !== undefined && (
                                        <div className="font-medium">
                                            {day.workHours}j
                                        </div>
                                    )}
                                    {day.lateMinutes !== undefined && day.lateMinutes > 0 && (
                                        <div className="flex items-center gap-1 text-amber-600">
                                            <AlertCircle className="h-3 w-3" />
                                            <span>+{day.lateMinutes}m</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Indicator */}
                {presentCount > 0 && (
                    <div className="pt-4 border-t">
                        <div className="flex items-start gap-2">
                            {lateCount === 0 ? (
                                <>
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-700">Kinerja Sangat Baik!</p>
                                        <p className="text-xs text-green-600 mt-1">
                                            Tidak ada keterlambatan minggu ini. Pertahankan!
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-amber-700">Perhatian Keterlambatan</p>
                                        <p className="text-xs text-amber-600 mt-1">
                                            Ada {lateCount} hari terlambat minggu ini. Usahakan datang tepat waktu.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
