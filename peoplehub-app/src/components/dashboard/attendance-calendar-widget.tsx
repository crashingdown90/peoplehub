"use client";

// @ai:cx - Attendance calendar heatmap widget

import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface AttendanceDay {
    date: Date;
    status: "present" | "late" | "absent" | "leave" | "weekend" | "holiday";
}

export interface AttendanceCalendarWidgetProps {
    data: AttendanceDay[];
    currentMonth?: Date;
    className?: string;
}

const statusColors: Record<string, string> = {
    present: "bg-green-500",
    late: "bg-yellow-500",
    absent: "bg-red-500",
    leave: "bg-blue-500",
    weekend: "bg-slate-200",
    holiday: "bg-purple-400",
};

const statusLabels: Record<string, string> = {
    present: "Hadir",
    late: "Terlambat",
    absent: "Tidak Hadir",
    leave: "Cuti",
    weekend: "Akhir Pekan",
    holiday: "Libur",
};

export function AttendanceCalendarWidget({
    data,
    currentMonth = new Date(),
    className
}: AttendanceCalendarWidgetProps) {
    // Get stats
    const stats = {
        present: data.filter(d => d.status === "present").length,
        late: data.filter(d => d.status === "late").length,
        absent: data.filter(d => d.status === "absent").length,
    };

    const totalDays = stats.present + stats.late + stats.absent;
    const attendanceRate = totalDays > 0
        ? Math.round(((stats.present + stats.late) / totalDays) * 100)
        : 0;

    // Group data by week
    const weeks: AttendanceDay[][] = [];
    let currentWeek: AttendanceDay[] = [];

    data.forEach((day, index) => {
        currentWeek.push(day);
        if ((index + 1) % 7 === 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) {
        weeks.push(currentWeek);
    }

    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white p-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-[var(--color-accent)]" />
                    <h3 className="font-semibold text-[var(--color-text)]">
                        Kehadiran Bulan Ini
                    </h3>
                </div>
                <Link href="/attendance">
                    <Button variant="ghost" size="sm" className="text-[var(--color-accent)]">
                        Lihat Semua
                    </Button>
                </Link>
            </div>

            {/* Attendance Rate */}
            <div className="mt-4">
                <div className="text-3xl font-bold text-[var(--color-text)]">
                    {attendanceRate}%
                </div>
                <p className="text-sm text-[var(--color-text-subtle)]">
                    Tingkat kehadiran
                </p>
            </div>

            {/* Calendar Grid */}
            <div className="mt-6 space-y-1">
                {/* Day labels */}
                <div className="grid grid-cols-7 gap-1 text-xs font-medium text-[var(--color-text-subtle)]">
                    {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, i) => (
                        <div key={i} className="flex h-6 items-center justify-center">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Weeks */}
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1">
                        {week.map((day, dayIndex) => {
                            const colorClass = statusColors[day.status];
                            const label = statusLabels[day.status];

                            return (
                                <div
                                    key={dayIndex}
                                    className={cn(
                                        "flex h-8 items-center justify-center rounded text-xs font-medium",
                                        colorClass,
                                        day.status === "weekend" || day.status === "holiday"
                                            ? "text-slate-500"
                                            : "text-white"
                                    )}
                                    title={`${day.date.toLocaleDateString('id-ID')}: ${label}`}
                                >
                                    {day.date.getDate()}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-green-500" />
                    <span>Hadir ({stats.present})</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-yellow-500" />
                    <span>Terlambat ({stats.late})</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded bg-red-500" />
                    <span>Absent ({stats.absent})</span>
                </div>
            </div>
        </div>
    );
}

AttendanceCalendarWidget.displayName = "AttendanceCalendarWidget";
