"use client";

// Attendance Heatmap Chart for HRD Dashboard

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, Clock, AlertCircle } from "lucide-react";

interface AttendanceDay {
    date: string;
    present: number;
    late: number;
    absent: number;
    total: number;
}

interface AttendanceHeatmapProps {
    data?: AttendanceDay[];
    className?: string;
}

// Generate sample data for demonstration
function generateSampleData(): AttendanceDay[] {
    const days = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const total = 245; // Total employees
        const presentRate = 0.85 + Math.random() * 0.12; // 85-97%
        const present = Math.floor(total * presentRate);
        const late = Math.floor((total - present) * 0.6);
        const absent = total - present - late;

        days.push({
            date: date.toISOString().split('T')[0],
            present,
            late,
            absent,
            total,
        });
    }

    return days;
}

export function AttendanceHeatmap({ data, className }: AttendanceHeatmapProps) {
    const attendanceData = data || generateSampleData();

    // Calculate summary stats
    const totalDays = attendanceData.length;
    const avgPresent = Math.round(
        attendanceData.reduce((sum, day) => sum + day.present, 0) / totalDays
    );
    const avgLate = Math.round(
        attendanceData.reduce((sum, day) => sum + day.late, 0) / totalDays
    );
    const avgAbsent = Math.round(
        attendanceData.reduce((sum, day) => sum + day.absent, 0) / totalDays
    );
    const totalEmployees = attendanceData[attendanceData.length - 1]?.total || 245;
    const presentRate = Math.round((avgPresent / totalEmployees) * 100);

    // Get color based on attendance rate
    const getIntensity = (rate: number) => {
        if (rate > 0.95) return "bg-green-600";
        if (rate > 0.90) return "bg-green-500";
        if (rate > 0.85) return "bg-green-400";
        if (rate > 0.80) return "bg-yellow-400";
        if (rate > 0.75) return "bg-orange-400";
        return "bg-red-400";
    };

    // Group by weeks
    const weeks: AttendanceDay[][] = [];
    for (let i = 0; i < attendanceData.length; i += 7) {
        weeks.push(attendanceData.slice(i, i + 7));
    }

    return (
        <Card className={cn("", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Heatmap Kehadiran 30 Hari</CardTitle>
                        <CardDescription className="mt-1">
                            Rata-rata kehadiran: <span className="font-semibold">{presentRate}%</span>
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {totalEmployees} karyawan
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Heatmap Grid */}
                <div className="space-y-2">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex gap-2">
                            {week.map((day, dayIndex) => {
                                const rate = day.present / day.total;
                                const dateObj = new Date(day.date);
                                const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                                const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

                                return (
                                    <div
                                        key={dayIndex}
                                        className="group relative flex-1"
                                    >
                                        <div
                                            className={cn(
                                                "h-12 rounded-md transition-all",
                                                getIntensity(rate),
                                                "hover:ring-2 hover:ring-offset-2 hover:ring-primary cursor-pointer"
                                            )}
                                            title={`${dateStr}: ${day.present} hadir, ${day.late} terlambat, ${day.absent} absen`}
                                        />
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                            <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-md p-2 whitespace-nowrap border">
                                                <div className="font-medium">{dayName}, {dateStr}</div>
                                                <div className="mt-1 space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                                        <span>Hadir: {day.present}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                                        <span>Terlambat: {day.late}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-red-500" />
                                                        <span>Absen: {day.absent}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                        <span className="text-muted-foreground">Tingkat kehadiran:</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded bg-red-400" />
                                <span>&lt;75%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded bg-orange-400" />
                                <span>75-80%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded bg-yellow-400" />
                                <span>80-85%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded bg-green-400" />
                                <span>85-90%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded bg-green-500" />
                                <span>90-95%</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-3 w-3 rounded bg-green-600" />
                                <span>&gt;95%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-600">
                            <Users className="h-5 w-5" />
                            {avgPresent}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Rata-rata Hadir/Hari</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-orange-600">
                            <Clock className="h-5 w-5" />
                            {avgLate}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Rata-rata Terlambat/Hari</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            {avgAbsent}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Rata-rata Absen/Hari</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

AttendanceHeatmap.displayName = "AttendanceHeatmap";
