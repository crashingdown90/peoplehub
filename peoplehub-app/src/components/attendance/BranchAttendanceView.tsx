// @ai:ag - Branch Attendance View for HRD (admin)

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building, Search, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface BranchAttendanceData {
    employeeId: string;
    fullName: string;
    department: string;
    position: string;
    branch: string;
    status: "PRESENT" | "LATE" | "ABSENT" | "LEAVE" | "HOLIDAY" | "NOT_CLOCKED_IN";
    clockIn?: string;
    clockOut?: string;
    workMode?: "WFO" | "WFH";
    lateMinutes?: number;
}

interface BranchAttendanceViewProps {
    attendanceData: BranchAttendanceData[];
    branches: string[];
    departments: string[];
    date?: string;
    onExport?: () => void;
}

export function BranchAttendanceView({
    attendanceData,
    branches,
    departments,
    date,
    onExport,
}: BranchAttendanceViewProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

    const currentDate = date || new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    // Filter data
    const filteredData = attendanceData.filter((item) => {
        const matchesSearch =
            item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.position.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesBranch = selectedBranch === "ALL" || item.branch === selectedBranch;
        const matchesDepartment = selectedDepartment === "ALL" || item.department === selectedDepartment;
        const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;

        return matchesSearch && matchesBranch && matchesDepartment && matchesStatus;
    });

    // Calculate statistics
    const stats = {
        total: filteredData.length,
        present: filteredData.filter((d) => d.status === "PRESENT").length,
        late: filteredData.filter((d) => d.status === "LATE").length,
        absent: filteredData.filter((d) => d.status === "ABSENT").length,
        leave: filteredData.filter((d) => d.status === "LEAVE").length,
        notClockedIn: filteredData.filter((d) => d.status === "NOT_CLOCKED_IN").length,
    };

    const attendanceRate =
        stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

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

    return (
        <div className="space-y-4">
            {/* Header & Stats */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building className="h-5 w-5 text-blue-600" />
                                Kehadiran Perusahaan
                            </CardTitle>
                            <p className="text-sm text-slate-500 mt-1">{currentDate}</p>
                        </div>
                        {onExport && (
                            <Button variant="outline" size="sm" onClick={onExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Overall Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        <div className="bg-slate-100 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                            <p className="text-xs text-slate-600 mt-1">Total</p>
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
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-blue-600">{stats.leave}</p>
                            <p className="text-xs text-blue-700 mt-1">Cuti</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-purple-600">{attendanceRate}%</p>
                            <p className="text-xs text-purple-700 mt-1">Tingkat</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid md:grid-cols-4 gap-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Cari karyawan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Branch Filter */}
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Cabang</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch} value={branch}>
                                        {branch}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Department Filter */}
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Departemen" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Departemen</SelectItem>
                                {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                        {dept}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Semua Status</SelectItem>
                                <SelectItem value="PRESENT">Hadir</SelectItem>
                                <SelectItem value="LATE">Terlambat</SelectItem>
                                <SelectItem value="ABSENT">Tidak Hadir</SelectItem>
                                <SelectItem value="LEAVE">Cuti</SelectItem>
                                <SelectItem value="NOT_CLOCKED_IN">Belum Absen</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                                        Departemen
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                                        Cabang
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                                        Clock In
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                                        Clock Out
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                                        Mode
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                            Tidak ada data ditemukan
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={index} className="hover:bg-slate-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{item.fullName}</p>
                                                    <p className="text-xs text-slate-500">{item.position}</p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{item.department}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{item.branch}</td>
                                            <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {item.clockIn ? formatTime(item.clockIn) : "-"}
                                                {item.lateMinutes && item.lateMinutes > 0 && (
                                                    <span className="text-xs text-amber-600 ml-1">(+{item.lateMinutes}m)</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {item.clockOut ? formatTime(item.clockOut) : "-"}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {item.workMode || "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
