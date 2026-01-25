// @ai:ag - Today Status Card showing current attendance status

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, MapPin, Briefcase } from "lucide-react";

interface TodayAttendance {
    id?: string;
    clockIn?: string;
    clockOut?: string;
    workMode: "WFO" | "WFH";
    status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "HOLIDAY";
    lateMinutes?: number;
    workDuration?: number; // in minutes
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
}

interface TodayStatusCardProps {
    attendance: TodayAttendance | null;
    schedule?: {
        shiftName: string;
        startTime: string;
        endTime: string;
    };
}

export function TodayStatusCard({ attendance, schedule }: TodayStatusCardProps) {
    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}j ${mins}m`;
    };

    const getStatusBadge = () => {
        if (!attendance) {
            return (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                    Belum Absen
                </Badge>
            );
        }

        switch (attendance.status) {
            case "PRESENT":
                return (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                        Hadir Tepat Waktu
                    </Badge>
                );
            case "LATE":
                return (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        Terlambat {attendance.lateMinutes}m
                    </Badge>
                );
            case "ABSENT":
                return (
                    <Badge variant="destructive">
                        Tidak Hadir
                    </Badge>
                );
            case "LEAVE":
                return (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        Cuti
                    </Badge>
                );
            case "HOLIDAY":
                return (
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                        Libur
                    </Badge>
                );
            default:
                return null;
        }
    };

    const getWorkModeIcon = () => {
        if (!attendance) return null;

        if (attendance.workMode === "WFO") {
            return (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                    <MapPin className="h-3 w-3" />
                    <span>WFO (Kantor)</span>
                </div>
            );
        } else {
            return (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Briefcase className="h-3 w-3" />
                    <span>WFH (Rumah)</span>
                </div>
            );
        }
    };

    const currentDate = new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">Status Hari Ini</CardTitle>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {currentDate}
                        </p>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Schedule Info */}
                {schedule && (
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Shift Hari Ini</p>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-900">
                                {schedule.shiftName}
                            </span>
                            <span className="text-sm text-slate-600">
                                ({schedule.startTime} - {schedule.endTime})
                            </span>
                        </div>
                    </div>
                )}

                {/* Attendance Details */}
                {attendance ? (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Clock In */}
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Clock In</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {attendance.clockIn ? formatTime(attendance.clockIn) : "-"}
                            </p>
                        </div>

                        {/* Clock Out */}
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Clock Out</p>
                            <p className="text-sm font-semibold text-slate-900">
                                {attendance.clockOut ? formatTime(attendance.clockOut) : "-"}
                            </p>
                        </div>

                        {/* Work Duration */}
                        {attendance.workDuration !== undefined && (
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Durasi Kerja</p>
                                <p className="text-sm font-semibold text-slate-900">
                                    {formatDuration(attendance.workDuration)}
                                </p>
                            </div>
                        )}

                        {/* Work Mode */}
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Mode Kerja</p>
                            {getWorkModeIcon()}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Clock className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                            Anda belum melakukan absensi hari ini
                        </p>
                    </div>
                )}

                {/* Location Info (for WFO) */}
                {attendance?.workMode === "WFO" && attendance?.location && (
                    <div className="border-t pt-3">
                        <p className="text-xs text-slate-500 mb-1">Lokasi Clock In</p>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs text-slate-700">
                                    {attendance.location.address || `${attendance.location.latitude}, ${attendance.location.longitude}`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
