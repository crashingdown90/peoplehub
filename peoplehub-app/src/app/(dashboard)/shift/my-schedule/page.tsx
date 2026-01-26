"use client";

// @ai:cx - My shift schedule page

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

interface ShiftSchedule {
    id: string;
    date: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    location?: string;
    isOff: boolean;
}

const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function MySchedulePage() {
    const router = useRouter();
    const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day;
        return new Date(today.setDate(diff));
    });

    useEffect(() => {
        // Generate mock schedule for current week
        const timer = setTimeout(() => {
            const mockSchedules: ShiftSchedule[] = [];
            for (let i = 0; i < 7; i++) {
                const date = new Date(currentWeekStart);
                date.setDate(currentWeekStart.getDate() + i);
                const isWeekend = i === 0 || i === 6;

                mockSchedules.push({
                    id: `schedule-${i}`,
                    date: date.toISOString(),
                    shiftName: isWeekend ? "Libur" : "Shift Pagi",
                    startTime: isWeekend ? "-" : "08:00",
                    endTime: isWeekend ? "-" : "17:00",
                    location: isWeekend ? undefined : "Kantor Pusat",
                    isOff: isWeekend,
                });
            }
            setSchedules(mockSchedules);
            setIsLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [currentWeekStart]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return {
            day: dayNames[date.getDay()],
            date: date.getDate(),
            month: date.toLocaleDateString("id-ID", { month: "short" }),
        };
    };

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(currentWeekStart.getDate() + direction * 7);
        setCurrentWeekStart(newDate);
    };

    const isToday = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-2xl">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Jadwal Shift Saya</h1>
                        <p className="text-slate-600">Lihat jadwal kerja mingguan</p>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                        &larr; Minggu Lalu
                    </Button>
                    <span className="text-sm font-medium text-slate-700">
                        {currentWeekStart.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                        Minggu Depan &rarr;
                    </Button>
                </div>

                {/* Schedule List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5" />
                            Jadwal Minggu Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {schedules.map((schedule) => {
                                const { day, date, month } = formatDate(schedule.date);
                                const today = isToday(schedule.date);

                                return (
                                    <div
                                        key={schedule.id}
                                        className={`flex items-center gap-4 rounded-lg border p-4 ${
                                            today
                                                ? "border-blue-500 bg-blue-50"
                                                : schedule.isOff
                                                  ? "border-slate-200 bg-slate-50"
                                                  : "border-slate-200 bg-white"
                                        }`}
                                    >
                                        {/* Date */}
                                        <div className="w-16 text-center">
                                            <p className="text-xs text-slate-500">{day}</p>
                                            <p className={`text-2xl font-bold ${today ? "text-blue-600" : "text-slate-900"}`}>
                                                {date}
                                            </p>
                                            <p className="text-xs text-slate-500">{month}</p>
                                        </div>

                                        {/* Shift Info */}
                                        <div className="flex-1">
                                            <p className={`font-medium ${schedule.isOff ? "text-slate-500" : "text-slate-900"}`}>
                                                {schedule.shiftName}
                                            </p>
                                            {!schedule.isOff && (
                                                <>
                                                    <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                                                        <Clock className="h-4 w-4" />
                                                        <span>
                                                            {schedule.startTime} - {schedule.endTime}
                                                        </span>
                                                    </div>
                                                    {schedule.location && (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {schedule.location}
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Today Badge */}
                                        {today && (
                                            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                                                Hari Ini
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
