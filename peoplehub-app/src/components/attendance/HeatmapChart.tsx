// @ai:ag - Attendance Heatmap Chart showing monthly attendance patterns

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HeatmapData {
    date: string; // YYYY-MM-DD
    value: number; // 0-100 (attendance percentage or count)
    status?: "good" | "warning" | "bad";
}

interface AttendanceHeatmapProps {
    data: HeatmapData[];
    month: number; // 0-11
    year: number;
    title?: string;
}

export function AttendanceHeatmap({ data, month, year, title }: AttendanceHeatmapProps) {
    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Generate calendar grid
    const weeks: (HeatmapData | null)[][] = [];
    let currentWeek: (HeatmapData | null)[] = [];

    // Fill initial empty days
    for (let i = 0; i < firstDayOfMonth; i++) {
        currentWeek.push(null);
    }

    // Fill actual days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayData = data.find((d) => d.date === dateStr);

        currentWeek.push(dayData || { date: dateStr, value: 0 });

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    // Fill remaining days
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push(null);
        }
        weeks.push(currentWeek);
    }

    const getColorClass = (value: number, status?: string) => {
        if (status === "good" || value >= 90) {
            return "bg-green-500";
        } else if (status === "warning" || value >= 70) {
            return "bg-amber-500";
        } else if (status === "bad" || value >= 50) {
            return "bg-orange-500";
        } else if (value > 0) {
            return "bg-red-500";
        }
        return "bg-slate-200";
    };

    const getOpacity = (value: number) => {
        if (value === 0) return "opacity-30";
        if (value < 25) return "opacity-40";
        if (value < 50) return "opacity-60";
        if (value < 75) return "opacity-80";
        return "opacity-100";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {title || `Heatmap Kehadiran - ${monthNames[month]} ${year}`}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-3">
                    {/* Day labels */}
                    <div className="grid grid-cols-7 gap-1 text-xs text-center font-medium text-slate-600">
                        <div>Min</div>
                        <div>Sen</div>
                        <div>Sel</div>
                        <div>Rab</div>
                        <div>Kam</div>
                        <div>Jum</div>
                        <div>Sab</div>
                    </div>

                    {/* Heatmap grid */}
                    <div className="space-y-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                {week.map((day, dayIndex) => {
                                    if (!day) {
                                        return <div key={dayIndex} className="aspect-square" />;
                                    }

                                    const dayNumber = parseInt(day.date.split("-")[2]);
                                    const isToday =
                                        day.date === new Date().toISOString().split("T")[0];

                                    return (
                                        <div
                                            key={dayIndex}
                                            className={`
                        aspect-square rounded-sm relative group cursor-pointer
                        ${getColorClass(day.value, day.status)}
                        ${getOpacity(day.value)}
                        ${isToday ? "ring-2 ring-blue-500" : ""}
                        transition-all hover:scale-110
                      `}
                                            title={`${dayNumber} ${monthNames[month]} - ${day.value}%`}
                                        >
                                            {/* Day number */}
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                                                {dayNumber}
                                            </div>

                                            {/* Tooltip on hover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                <div className="bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                                    {dayNumber} {monthNames[month]}: {day.value}%
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-600">Kurang:</span>
                            <div className="flex gap-1">
                                <div className="w-4 h-4 rounded-sm bg-red-500 opacity-100" />
                                <div className="w-4 h-4 rounded-sm bg-orange-500 opacity-100" />
                                <div className="w-4 h-4 rounded-sm bg-amber-500 opacity-100" />
                                <div className="w-4 h-4 rounded-sm bg-green-500 opacity-100" />
                            </div>
                            <span className="text-slate-600">Baik</span>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-4 gap-3 pt-4 border-t">
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Rata-rata</p>
                            <p className="text-lg font-bold text-slate-900">
                                {data.length > 0
                                    ? Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)
                                    : 0}
                                %
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Tertinggi</p>
                            <p className="text-lg font-bold text-green-600">
                                {data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Terendah</p>
                            <p className="text-lg font-bold text-red-600">
                                {data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0}%
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-slate-500">Total Hari</p>
                            <p className="text-lg font-bold text-slate-900">
                                {data.filter((d) => d.value > 0).length}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
