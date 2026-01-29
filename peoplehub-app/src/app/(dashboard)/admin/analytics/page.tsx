"use client";

// @ai:cx

import { useState, useEffect } from "react";
import { ChartCard, StatsGrid } from "@/components/dashboard";
import { Users, Clock, Calendar, Loader2, BarChart3 } from "lucide-react";

interface AttendanceStats {
    overview: {
        totalEmployees: number;
        totalAttendances: number;
        totalPresent: number;
        totalLate: number;
        lateRate: number;
        wfoRate: number;
        wfhRate: number;
    };
}

interface EmployeeStats {
    overview: {
        total: number;
        active: number;
        terminated: number;
        newHiresThisYear: number;
        turnoverRate: number;
    };
    byDepartment: Array<{ department: string; count: number }>;
}

interface LeaveStats {
    overview: {
        totalRequests: number;
        approved: number;
        pending: number;
        totalDaysUsed: number;
    };
    byType: Array<{ type: string; count: number; totalDays: number }>;
}

export default function AnalyticsPage() {
    const [attendance, setAttendance] = useState<AttendanceStats | null>(null);
    const [employees, setEmployees] = useState<EmployeeStats | null>(null);
    const [leave, setLeave] = useState<LeaveStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    async function fetchAnalytics() {
        try {
            const [attRes, empRes, leaveRes] = await Promise.all([
                fetch("/api/analytics/attendance"),
                fetch("/api/analytics/employees"),
                fetch("/api/analytics/leave"),
            ]);

            const [attData, empData, leaveData] = await Promise.all([
                attRes.json(),
                empRes.json(),
                leaveRes.json(),
            ]);

            if (attData.success) setAttendance(attData.data);
            if (empData.success) setEmployees(empData.data);
            if (leaveData.success) setLeave(leaveData.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const lateRate = attendance?.overview.lateRate ?? 0;
    const turnoverRate = employees?.overview.turnoverRate ?? 0;
    const wfhRate = attendance?.overview.wfhRate ?? 0;
    const wfoRate = attendance?.overview.wfoRate ?? 0;
    const leaveUsed = leave?.overview.totalDaysUsed ?? 0;
    const leaveApproved = leave?.overview.approved ?? 0;
    const totalActive = employees?.overview.active ?? 0;
    const totalPresent = attendance?.overview.totalPresent ?? 0;
    const totalEmployees = attendance?.overview.totalEmployees ?? 0;
    const attendanceRate = totalEmployees > 0 ? Math.round((totalPresent / totalEmployees) * 100) : 0;
    const topDepartments = employees?.byDepartment ?? [];

    const summaryItems = [
        {
            title: "Tingkat Keterlambatan",
            value: `${lateRate}%`,
            description: lateRate > 10 ? "Perlu perhatian" : "Stabil",
            trend: { value: lateRate, direction: (lateRate > 10 ? "down" : "up") as "up" | "down" },
        },
        {
            title: "Turnover",
            value: `${turnoverRate}%`,
            description: "12 bulan terakhir",
            trend: { value: turnoverRate, direction: (turnoverRate > 15 ? "down" : "neutral") as "down" | "neutral" },
        },
        {
            title: "WFH vs WFO",
            value: `${wfhRate}% WFH`,
            description: `${wfoRate}% WFO`,
        },
        {
            title: "Cuti Terpakai",
            value: `${leaveUsed} hari`,
            description: `${leaveApproved} disetujui`,
        },
    ];

    const volumeItems = [
        {
            title: "Karyawan Aktif",
            value: totalActive,
            description: `${employees?.overview.newHiresThisYear ?? 0} rekrutmen tahun ini`,
            icon: <Users className="h-5 w-5 text-blue-600" />,
        },
        {
            title: "Hadir Hari Ini",
            value: totalPresent,
            description: `${totalEmployees} total karyawan`,
            trend: { value: attendanceRate, direction: "up" as const },
            icon: <Clock className="h-5 w-5 text-green-600" />,
        },
        {
            title: "Total Kehadiran",
            value: attendance?.overview.totalAttendances ?? 0,
            description: "Rekap bulan ini",
            icon: <BarChart3 className="h-5 w-5 text-slate-600" />,
        },
        {
            title: "Pengajuan Cuti",
            value: leave?.overview.totalRequests ?? 0,
            description: `${leave?.overview.pending ?? 0} menunggu`,
            icon: <Calendar className="h-5 w-5 text-orange-600" />,
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
                    <p className="text-slate-600">Insight dan statistik perusahaan</p>
                </div>

                <div className="mb-6">
                    <StatsGrid items={summaryItems} />
                </div>

                <div className="mb-8 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Ringkasan Volume</p>
                    <StatsGrid items={volumeItems} />
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <ChartCard
                        title="Statistik Kehadiran"
                        description="Sparkline 7 hari (placeholder) & rasio WFO/WFH"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Tingkat Keterlambatan</span>
                                <span className={`font-bold ${lateRate > 10 ? "text-red-600" : "text-green-600"}`}>
                                    {lateRate}%
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full bg-orange-500"
                                    style={{ width: `${Math.min(100, lateRate)}%` }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="rounded-lg bg-blue-50 p-3 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{wfoRate}%</p>
                                    <p className="text-xs text-slate-600">WFO Rate</p>
                                </div>
                                <div className="rounded-lg bg-green-50 p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">{wfhRate}%</p>
                                    <p className="text-xs text-slate-600">WFH Rate</p>
                                </div>
                            </div>

                            <Sparkline data={mockTrend} />
                        </div>
                    </ChartCard>

                    <ChartCard
                        title="Top Departemen Kehadiran"
                        description="Berdasar jumlah hadir/aktif"
                    >
                        <TopDepartmentTable departments={topDepartments} total={totalActive} />
                    </ChartCard>

                    <ChartCard
                        title="Statistik Cuti"
                        description="Ringkasan pengajuan cuti"
                    >
                        <div className="mb-4 grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <p className="text-xl font-bold text-green-600">{leaveApproved}</p>
                                <p className="text-xs text-slate-500">Disetujui</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-yellow-600">{leave?.overview.pending || 0}</p>
                                <p className="text-xs text-slate-500">Pending</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold text-slate-600">{leave?.overview.totalRequests || 0}</p>
                                <p className="text-xs text-slate-500">Total</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {leave?.byType.slice(0, 4).map((type, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span className="text-sm text-slate-600">{type.type}</span>
                                    <span className="text-sm font-medium">{type.totalDays} hari</span>
                                </div>
                            ))}
                        </div>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
}

function Sparkline({ data }: { data: number[] }) {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    return (
        <div className="mt-4 h-16 w-full rounded-lg border border-slate-100 bg-white px-3 py-2">
            <p className="text-xs text-slate-500">Tren 7 hari (placeholder)</p>
            <div className="mt-2 flex h-8 items-end gap-1">
                {data.map((value, idx) => (
                    <div
                        key={idx}
                        className="flex-1 rounded-sm bg-blue-500/70"
                        style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
                        title={`Hari ${idx + 1}: ${value}`}
                    />
                ))}
            </div>
        </div>
    );
}

function TopDepartmentTable({
    departments,
    total,
}: {
    departments: Array<{ department: string; count: number }>;
    total: number;
}) {
    if (!departments.length) {
        return <p className="text-sm text-slate-500">Data departemen belum tersedia.</p>;
    }

    const rows = departments.slice(0, 5).map((dept) => {
        const percentage = total > 0 ? Math.round((dept.count / total) * 100) : 0;
        return { ...dept, percentage };
    });

    return (
        <div className="space-y-3">
            {rows.map((dept, i) => (
                <div key={dept.department + i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-800">{dept.department}</span>
                        <span className="text-slate-600">{dept.count} org</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                            <div className="h-full bg-blue-500" style={{ width: `${dept.percentage}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{dept.percentage}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

const mockTrend = [8, 12, 7, 14, 10, 9, 13];
