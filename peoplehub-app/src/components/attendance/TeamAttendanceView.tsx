// @ai:ag - Team Attendance View for managers

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, Clock, MapPin, Home } from "lucide-react";
import { useState } from "react";

interface TeamMemberAttendance {
    id: string;
    employeeId: string;
    fullName: string;
    position: string;
    photoUrl?: string;
    status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "HOLIDAY" | "NOT_CLOCKED_IN";
    clockIn?: string;
    clockOut?: string;
    workMode?: "WFO" | "WFH";
    lateMinutes?: number;
}

interface TeamAttendanceViewProps {
    teamMembers: TeamMemberAttendance[];
    date?: string;
}

export function TeamAttendanceView({ teamMembers, date }: TeamAttendanceViewProps) {
    const [searchQuery, setSearchQuery] = useState("");

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
            case "NOT_CLOCKED_IN":
                return <Badge variant="secondary">Belum Absen</Badge>;
            default:
                return null;
        }
    };

    const formatTime = (timeStr: string) => {
        return new Date(timeStr).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const currentDate = date || new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // Filter team members
    const filteredMembers = teamMembers.filter((member) =>
        member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.position.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Statistics
    const stats = {
        total: teamMembers.length,
        present: teamMembers.filter((m) => m.status === "PRESENT").length,
        late: teamMembers.filter((m) => m.status === "LATE").length,
        absent: teamMembers.filter((m) => m.status === "ABSENT").length,
        notClockedIn: teamMembers.filter((m) => m.status === "NOT_CLOCKED_IN").length,
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-600" />
                                Kehadiran Tim
                            </CardTitle>
                            <p className="text-sm text-slate-500 mt-1">{currentDate}</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            <p className="text-xs text-slate-600 mt-1">Total Tim</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
                            <p className="text-xs text-green-700 mt-1">Hadir</p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
                            <p className="text-xs text-amber-700 mt-1">Terlambat</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
                            <p className="text-xs text-red-700 mt-1">Tidak Hadir</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-slate-600">{stats.notClockedIn}</p>
                            <p className="text-xs text-slate-600 mt-1">Belum Absen</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Cari nama atau jabatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Team Members List */}
            <div className="space-y-2">
                {filteredMembers.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <Users className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">Tidak ada anggota tim ditemukan</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredMembers.map((member) => (
                        <Card key={member.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {member.photoUrl ? (
                                            <img
                                                src={member.photoUrl}
                                                alt={member.fullName}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                                <span className="text-lg font-semibold text-slate-600">
                                                    {member.fullName.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h4 className="font-semibold text-slate-900 truncate">
                                                    {member.fullName}
                                                </h4>
                                                <p className="text-xs text-slate-500">{member.position}</p>
                                            </div>
                                            {getStatusBadge(member.status)}
                                        </div>

                                        {/* Attendance Details */}
                                        {member.status !== "NOT_CLOCKED_IN" && member.status !== "ABSENT" && (
                                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                                                {member.clockIn && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{formatTime(member.clockIn)}</span>
                                                        {member.clockOut && (
                                                            <>
                                                                <span>-</span>
                                                                <span>{formatTime(member.clockOut)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {member.workMode && (
                                                    <div className="flex items-center gap-1">
                                                        {member.workMode === "WFO" ? (
                                                            <MapPin className="h-3 w-3" />
                                                        ) : (
                                                            <Home className="h-3 w-3" />
                                                        )}
                                                        <span>{member.workMode}</span>
                                                    </div>
                                                )}

                                                {member.lateMinutes && member.lateMinutes > 0 && (
                                                    <div className="flex items-center gap-1 text-amber-600">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Terlambat {member.lateMinutes}m</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
