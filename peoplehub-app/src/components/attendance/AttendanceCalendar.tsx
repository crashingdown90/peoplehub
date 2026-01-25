// @ai:ag - Attendance Calendar component showing monthly attendance

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AttendanceRecord {
    date: string; // YYYY-MM-DD
    status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "HOLIDAY" | "WEEKEND";
    clockIn?: string;
    clockOut?: string;
}

interface AttendanceCalendarProps {
    attendanceData: AttendanceRecord[];
    onDateClick?: (date: string) => void;
}

export function AttendanceCalendar({ attendanceData, onDateClick }: AttendanceCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month (0 = Sunday, 1 = Monday, ...)
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    // Get number of days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get number of days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PRESENT":
                return "bg-green-500";
            case "LATE":
                return "bg-amber-500";
            case "ABSENT":
                return "bg-red-500";
            case "LEAVE":
                return "bg-blue-500";
            case "HOLIDAY":
                return "bg-purple-500";
            case "WEEKEND":
                return "bg-slate-300";
            default:
                return "bg-slate-100";
        }
    };

    const getAttendanceForDate = (dateStr: string) => {
        return attendanceData.find(a => a.date === dateStr);
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Generate calendar days
    const calendarDays = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        calendarDays.push({
            day,
            isCurrentMonth: false,
            date: new Date(year, month - 1, day),
        });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({
            day,
            isCurrentMonth: true,
            date: new Date(year, month, day),
        });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - calendarDays.length; // 6 weeks max
    for (let day = 1; day <= remainingDays; day++) {
        calendarDays.push({
            day,
            isCurrentMonth: false,
            date: new Date(year, month + 1, day),
        });
    }

    const isToday = (date: Date) => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Kalender Kehadiran</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleToday}
                        >
                            Hari Ini
                        </Button>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handlePrevMonth}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-[140px] text-center text-sm font-medium">
                                {monthNames[month]} {year}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleNextMonth}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-semibold text-slate-600 py-2"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((calDay, index) => {
                        const dateStr = calDay.date.toISOString().split("T")[0];
                        const attendance = getAttendanceForDate(dateStr);
                        const today = isToday(calDay.date);

                        return (
                            <button
                                key={index}
                                onClick={() => calDay.isCurrentMonth && onDateClick?.(dateStr)}
                                className={`
                  aspect-square p-1 rounded-lg text-sm font-medium
                  ${calDay.isCurrentMonth ? "text-slate-900" : "text-slate-400"}
                  ${today ? "ring-2 ring-blue-500" : ""}
                  ${calDay.isCurrentMonth && onDateClick ? "hover:bg-slate-100 cursor-pointer" : ""}
                  transition-colors
                `}
                                disabled={!calDay.isCurrentMonth}
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center">
                                    <span className="text-xs">{calDay.day}</span>
                                    {attendance && calDay.isCurrentMonth && (
                                        <div
                                            className={`w-1.5 h-1.5 rounded-full mt-1 ${getStatusColor(attendance.status)}`}
                                            title={attendance.status}
                                        />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Keterangan:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-slate-600">Hadir</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-slate-600">Terlambat</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-slate-600">Tidak Hadir</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-slate-600">Cuti</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-slate-600">Libur</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-300" />
                            <span className="text-slate-600">Akhir Pekan</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
