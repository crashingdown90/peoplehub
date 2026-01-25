// @ai:ag - Dashboard with role-based views
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, Calendar, FileText, Users, AlertCircle, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import {
    DashboardSkeleton as DashboardSkeletonComponent,
    LeaveBalanceWidget,
    ShiftScheduleWidget,
    generateWeekShifts,
    ApprovalQueue,
    EnhancedMetricCard,
    AttendanceHeatmap,
    DepartmentBreakdown
} from "@/components/dashboard";

interface DashboardData {
    role: string;
    employee?: {
        today: { hasClockedIn: boolean; hasClockedOut: boolean; status: string };
        leaveBalance: number;
        pendingSubmissions: number;
    };
    manager?: {
        teamAttendance: { present: number; late: number; absent: number };
        pendingApprovals: number;
    };
    hrd?: {
        companyStats: { totalEmployees: number; todayPresent: number; todayLate: number };
        pendingRegistrations: number;
    };
    finance?: {
        pendingPayroll: number;
        pendingReimbursements: number;
    };
    it?: {
        activeUsers: number;
        systemStatus: string;
    };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            // Fetch based on user role - backend returns appropriate data
            const res = await fetch("/api/dashboard/stats");
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <DashboardSkeletonComponent />;
    }

    // Render based on role
    switch (data?.role) {
        case "EMPLOYEE":
            return <EmployeeDashboard data={data.employee} />;
        case "MANAGER":
            return <ManagerDashboard data={data.manager} employee={data.employee} />;
        case "HRD":
            return <HrdDashboard data={data.hrd} />;
        case "FINANCE":
            return <FinanceDashboard data={data.finance} />;
        case "IT_OPS":
            return <ItDashboard data={data.it} />;
        default:
            return <EmployeeDashboard data={data?.employee} />;
    }
}

// Employee Dashboard Component
function EmployeeDashboard({ data }: { data: DashboardData['employee'] }) {
    // Generate mock shift data - uses current day index
    const shiftData = generateWeekShifts();

    // Leave balance data - in production from API
    const leaveBalances = [
        { type: 'Cuti Tahunan', balance: 7, used: 5, total: 12, color: 'bg-blue-500' },
        { type: 'Cuti Sakit', balance: 13, used: 1, total: 14, color: 'bg-red-500' },
        { type: 'Cuti Pribadi', balance: 3, used: 0, total: 3, color: 'bg-purple-500' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>

            {/* Primary Stats Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Attendance Status Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Status Kehadiran</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data?.today?.hasClockedIn ? (
                                data?.today?.hasClockedOut ? "Selesai" : "Sudah Masuk"
                            ) : "Belum Absen"}
                        </div>
                        <Link href="/attendance">
                            <Button className="mt-2 w-full" size="sm">
                                {data?.today?.hasClockedIn && !data?.today?.hasClockedOut
                                    ? "Clock Out"
                                    : "Clock In"}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Leave Balance Summary Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Sisa Cuti</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.leaveBalance || 0} hari</div>
                        <Link href="/leave">
                            <Button variant="outline" className="mt-2 w-full" size="sm">
                                Ajukan Cuti
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Pending Submissions Card */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pengajuan Pending</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.pendingSubmissions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Menunggu approval
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/payslips" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Lihat Slip Gaji
                            </Button>
                        </Link>
                        <Link href="/leave" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <Calendar className="mr-2 h-4 w-4" />
                                Riwayat Cuti
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary Widgets Row */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Leave Balance Widget - detailed view */}
                <LeaveBalanceWidget
                    balances={leaveBalances}
                    className="h-full"
                />

                {/* Shift Schedule Widget - 7 day view */}
                <ShiftScheduleWidget
                    shifts={shiftData}
                    className="h-full"
                />
            </div>
        </div>
    );
}


// HRD Dashboard Component
function HrdDashboard({ data }: { data: DashboardData['hrd'] }) {
    // Mock approval data - in production this would come from API
    // Using static dates for mock data to avoid React strict mode warnings
    const pendingApprovals = useMemo(() => [
        {
            id: '1',
            type: 'leave' as const,
            employeeName: 'Ahmad Subagyo',
            employeePhoto: '/avatars/placeholder.jpg',
            submittedAt: '2026-01-24T08:00:00.000Z', // Static mock date
            description: 'Cuti Tahunan - 3 hari',
            status: 'pending' as const,
        },
        {
            id: '2',
            type: 'overtime' as const,
            employeeName: 'Siti Nurhaliza',
            employeePhoto: '/avatars/placeholder.jpg',
            submittedAt: '2026-01-24T05:00:00.000Z', // Static mock date
            description: 'Lembur 4 jam',
            status: 'pending' as const,
        },
        {
            id: '3',
            type: 'reimburse' as const,
            employeeName: 'Bambang Hartono',
            employeePhoto: '/avatars/placeholder.jpg',
            submittedAt: '2026-01-23T10:00:00.000Z', // Static mock date
            description: 'Reimburse Transport Rp 150.000',
            status: 'pending' as const,
        },
    ], []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard HRD</h1>

            {/* Primary Stats Row - Enhanced with trends */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Employees */}
                <EnhancedMetricCard
                    title="Total Karyawan"
                    value={data?.companyStats?.totalEmployees || 245}
                    subtitle="Karyawan aktif"
                    icon={Users}
                    trend={{
                        value: 5,
                        label: "vs bulan lalu",
                        isPositive: true
                    }}
                    action={{
                        label: "Kelola Karyawan",
                        href: "/admin/employees"
                    }}
                />

                {/* Today's Present */}
                <EnhancedMetricCard
                    title="Hadir Hari Ini"
                    value={data?.companyStats?.todayPresent || 215}
                    subtitle={`${data?.companyStats?.todayLate || 15} terlambat`}
                    icon={CheckCircle}
                    variant="success"
                    trend={{
                        value: 2,
                        label: "vs kemarin",
                        isPositive: true
                    }}
                />

                {/* Pending Registrations */}
                <EnhancedMetricCard
                    title="Registrasi Pending"
                    value={data?.pendingRegistrations || 3}
                    subtitle="Menunggu verifikasi"
                    icon={AlertCircle}
                    variant={(data?.pendingRegistrations ?? 0) > 0 ? "warning" : "default"}
                    action={{
                        label: "Review Sekarang",
                        href: "/admin/registrations"
                    }}
                />

                {/* Cuti Request */}
                <EnhancedMetricCard
                    title="Pengajuan Cuti"
                    value={12}
                    subtitle="Pending approval"
                    icon={Calendar}
                    variant="info"
                    trend={{
                        value: 8,
                        label: "dari minggu lalu",
                        isPositive: false
                    }}
                    action={{
                        label: "Lihat Semua",
                        href: "/approvals"
                    }}
                />
            </div>

            {/* Visualizations Row */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Attendance Heatmap - 30 days */}
                <AttendanceHeatmap className="lg:col-span-2" />

                {/* Department Breakdown */}
                <DepartmentBreakdown />

                {/* Approval Queue - handlers to be implemented when API is ready */}
                <ApprovalQueue
                    items={pendingApprovals}
                    onApprove={() => {
                        // TODO: Implement approval API call when backend is ready
                    }}
                    onReject={() => {
                        // TODO: Implement rejection API call when backend is ready
                    }}
                    className="h-full"
                />
            </div>
        </div>
    );
}

// Manager Dashboard Component
function ManagerDashboard({ data, employee }: { data: DashboardData['manager']; employee: DashboardData['employee'] }) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard Manager</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Team Attendance */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tim Hadir Hari Ini</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {data?.teamAttendance?.present || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data?.teamAttendance?.late || 0} terlambat, {data?.teamAttendance?.absent || 0} tidak hadir
                        </p>
                    </CardContent>
                </Card>

                {/* Pending Approvals */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Approval Pending</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.pendingApprovals || 0}</div>
                        <Link href="/approvals">
                            <Button variant="outline" className="mt-2 w-full" size="sm">
                                Review Sekarang
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* My Attendance */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Status Kehadiran Saya</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {employee?.today?.hasClockedIn ? (
                                employee?.today?.hasClockedOut ? "Selesai" : "Sudah Masuk"
                            ) : "Belum Absen"}
                        </div>
                        <Link href="/attendance">
                            <Button className="mt-2 w-full" size="sm">
                                {employee?.today?.hasClockedIn && !employee?.today?.hasClockedOut
                                    ? "Clock Out"
                                    : "Clock In"}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/team/attendance" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                Kehadiran Tim
                            </Button>
                        </Link>
                        <Link href="/approvals" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approval List
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Finance Dashboard Component
function FinanceDashboard({ data }: { data: DashboardData['finance'] }) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard Finance</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Pending Payroll */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Payroll Pending</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.pendingPayroll || 0}</div>
                        <Link href="/payroll">
                            <Button variant="outline" className="mt-2 w-full" size="sm">
                                Proses Payroll
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Pending Reimbursements */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Reimburse Pending</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.pendingReimbursements || 0}</div>
                        <Link href="/reimbursements">
                            <Button variant="outline" className="mt-2 w-full" size="sm">
                                Review Sekarang
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Link href="/payroll/reports" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Laporan Payroll
                            </Button>
                        </Link>
                        <Link href="/reimbursements" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                Reimburse List
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// IT Dashboard Component
function ItDashboard({ data }: { data: DashboardData['it'] }) {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Dashboard IT Operations</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Active Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.activeUsers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Pengguna online saat ini
                        </p>
                    </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {data?.systemStatus || "Online"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All systems operational
                        </p>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Aksi Cepat</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        <Link href="/admin/employees" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Users
                            </Button>
                        </Link>
                        <Link href="/system/logs" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <FileText className="mr-2 h-4 w-4" />
                                System Logs
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

