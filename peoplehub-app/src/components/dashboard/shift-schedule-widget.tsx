"use client";

// @ai:cx - Shift schedule widget for employee dashboard showing 7 days

import { cn } from "@/lib/utils";
import { Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ShiftDay {
    date: Date;
    dayName: string;
    startTime?: string;
    endTime?: string;
    isToday?: boolean;
    isOff?: boolean;
}

interface ShiftScheduleWidgetProps {
    shifts: ShiftDay[];
    className?: string;
}

const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function ShiftScheduleWidget({ shifts, className }: ShiftScheduleWidgetProps) {
    return (
        <div className={cn("rounded-xl border border-slate-200 bg-white p-6", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-(--color-accent)" />
                    <h3 className="font-semibold text-(--color-text)">Jadwal Shift Minggu Ini</h3>
                </div>
                <Link href="/shift/my-schedule">
                    <Button variant="ghost" size="sm" className="text-(--color-accent)">
                        Lihat Semua
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </Link>
            </div>

            <div className="mt-4 -mx-4 px-4 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-[500px] sm:min-w-full">
                    {shifts.map((shift, index) => {
                        const dayNumber = shift.date.getDate();
                        const dayName = dayNames[shift.date.getDay()];

                        return (
                            <div
                                key={index}
                                className={cn(
                                    "flex flex-1 flex-col items-center rounded-lg p-2 transition-colors min-w-[64px]",
                                    shift.isToday
                                        ? "bg-(--color-accent) text-white"
                                        : shift.isOff
                                            ? "bg-(--color-bg) text-(--color-text-muted)"
                                            : "bg-(--color-bg) text-(--color-text)"
                                )}
                            >
                                <span className="text-xs font-medium">{dayName}</span>
                                <span className={cn(
                                    "mt-1 text-lg font-bold",
                                    shift.isToday ? "text-white" : ""
                                )}>
                                    {dayNumber}
                                </span>
                                {shift.isOff ? (
                                    <span className="mt-1 text-xs">Libur</span>
                                ) : shift.startTime ? (
                                    <div className="mt-1 text-center text-xs whitespace-nowrap">
                                        <div>{shift.startTime}</div>
                                        <div className="text-[0.65rem] opacity-75">-</div>
                                        <div>{shift.endTime}</div>
                                    </div>
                                ) : (
                                    <span className="mt-1 text-xs">-</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex gap-2">
                <Link href="/shift/swap" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                        Tukar Shift
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// Helper function to generate mock shifts for current week
export function generateWeekShifts(todayIndex: number = new Date().getDay()): ShiftDay[] {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);

        const isWeekend = i === 0 || i === 6;
        const isToday = i === todayIndex;

        return {
            date,
            dayName: dayNames[i],
            startTime: isWeekend ? undefined : "08:00",
            endTime: isWeekend ? undefined : "17:00",
            isToday,
            isOff: isWeekend,
        };
    });
}

ShiftScheduleWidget.displayName = "ShiftScheduleWidget";
