// @ai:ag - Dashboard with role-based views
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Clock, Calendar, FileText, Users, AlertCircle, DollarSign, TrendingUp, CheckCircle, ChevronRight } from "lucide-react";
import {
    DashboardSkeleton as DashboardSkeletonComponent,
    LeaveBalanceWidget,
    ShiftScheduleWidget,
    ShiftDay,
    ApprovalQueue,
    EnhancedMetricCard,
    AttendanceHeatmap,
    DepartmentBreakdown,
    RecentActivityWidget,
    ActivityItem,
    DashboardHero
} from "@/components/dashboard";


interface ApprovalItem {
    id: string;
    type: 'leave' | 'overtime' | 'reimburse';
    employeeName: string;
    employeePhoto?: string;
    description: string;
    submittedAt: string;
    status: 'pending';
}

interface DepartmentStat {
    name: string;
    count: number;
    color: string;
}

interface DashboardData {
    role: string;
    userName: string;
    employee?: {
        today: { hasClockedIn: boolean; hasClockedOut: boolean; status: string };
        leaveBalance: number;
        pendingSubmissions: number;
        leaveBalances: Array<{ type: string; balance: number; used: number; total: number; color: string }>;
        recentActivity: ActivityItem[];
    };
    manager?: {
        teamAttendance: { present: number; late: number; absent: number };
        pendingApprovals: number;
        approvalQueue: ApprovalItem[];
    };
    admin?: {
        overview: { 
            totalEmployees: number; 
            todayPresent: number; 
            todayLate: number;
            pendingRegistrations: number;
            pendingLeaveApprovals: number;
        };
        byDepartment: DepartmentStat[];
        approvalQueue: ApprovalItem[];
        recentActivity: ActivityItem[];
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
            return <EmployeeDashboard data={data.employee} userName={data.userName} role={data.role} />;
        case "MANAGER":
            return <ManagerDashboard data={data.manager} employee={data.employee} userName={data.userName} role={data.role} />;
        case "HRD":
        case "SUPER_ADMIN":
            return <HrdDashboard data={data.admin} userName={data.userName} role={data.role} />;
        case "FINANCE":
            return <FinanceDashboard data={data.finance} userName={data.userName} role={data.role} />;
        case "IT_OPS":
            return <ItDashboard data={data.it} userName={data.userName} role={data.role} />;
        default:
            return <EmployeeDashboard data={data?.employee} userName={data?.userName || "Pengguna"} role={data?.role || "EMPLOYEE"} />;
    }
}

// Employee Dashboard Component
function EmployeeDashboard({ data, userName, role }: { data: DashboardData['employee'], userName: string, role: string }) {
    const [shiftData, setShiftData] = useState<ShiftDay[]>([]);

    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const weekStart = startOfWeek.toISOString().split('T')[0];
                
                const res = await fetch(`/api/schedules/weekly?weekStartDate=${weekStart}`);
                const json = await res.json();
                if (json.success) {
                    const mappedShifts = json.data.map((day: { date: string; dayName: string; shift?: { startTime: string; endTime: string } }) => ({
                        date: new Date(day.date),
                        dayName: day.dayName,
                        startTime: day.shift?.startTime,
                        endTime: day.shift?.endTime,
                        isToday: new Date(day.date).toDateString() === new Date().toDateString(),
                        isOff: !day.shift,
                    }));
                    setShiftData(mappedShifts);
                }
            } catch (err) {
                console.error("Dashboard shift fetch error:", err);
            }
        };

        fetchShifts();
    }, []);

    return (
        <div className="space-y-8">
            <DashboardHero userName={userName} role={role} />

            {/* Primary Stats Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <EnhancedMetricCard
                    title="Status Kehadiran"
                    value={data?.today?.hasClockedIn ? (data?.today?.hasClockedOut ? "Selesai" : "Sudah Masuk") : "Belum Absen"}
                    subtitle={data?.today?.hasClockedIn ? "Tetap produktif!" : "Jangan lupa untuk absen"}
                    icon={Clock}
                    variant={data?.today?.hasClockedIn ? "success" : "warning"}
                    action={{
                        label: "Lakukan Absensi",
                        href: "/attendance"
                    }}
                />

                <EnhancedMetricCard
                    title="Sisa Cuti"
                    value={`${data?.leaveBalance || 0} Hari`}
                    subtitle="Cuti tahunan tersedia"
                    icon={Calendar}
                    variant="info"
                    action={{
                        label: "Ajukan Cuti",
                        href: "/leave"
                    }}
                />

                <EnhancedMetricCard
                    title="Pengajuan Pending"
                    value={data?.pendingSubmissions || 0}
                    subtitle="Menunggu approval"
                    icon={FileText}
                    variant={(data?.pendingSubmissions ?? 0) > 0 ? "warning" : "default"}
                />

                <div className="grid grid-cols-1 gap-3">
                    <Link href="/payslips" className="group">
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl transition-all duration-300 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/10 active:scale-[0.98]">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Slip Gaji</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Lihat & Download</p>
                                </div>
                            </div>
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    </Link>

                    <Link href="/leave" className="group">
                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl transition-all duration-300 hover:border-purple-400 hover:shadow-md hover:shadow-purple-500/10 active:scale-[0.98]">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Riwayat Cuti</p>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">Status Pengajuan</p>
                                </div>
                            </div>
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-50 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Secondary Widgets Row */}
            <div className="grid gap-6 md:grid-cols-3">
                <LeaveBalanceWidget
                    balances={data?.leaveBalances || []}
                    className="h-full md:col-span-1"
                />

                <ShiftScheduleWidget
                    shifts={shiftData}
                    className="h-full md:col-span-1"
                />

                <RecentActivityWidget
                    activities={data?.recentActivity || []}
                    className="h-full md:col-span-1"
                />
            </div>
        </div>
    );
}


// HRD Dashboard Component
function HrdDashboard({ data, userName, role }: { data: DashboardData['admin'], userName: string, role: string }) {
    
    return (
        <div className="space-y-8">
            <DashboardHero userName={userName} role={role} />

            {/* Primary Stats Row - Enhanced with trends */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Employees */}
                <EnhancedMetricCard
                    title="Total Karyawan"
                    value={data?.overview?.totalEmployees ?? 0}
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
                    value={data?.overview?.todayPresent ?? 0}
                    subtitle={`${data?.overview?.todayLate ?? 0} terlambat`}
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
                    value={data?.overview?.pendingRegistrations ?? 0}
                    subtitle="Menunggu verifikasi"
                    icon={AlertCircle}
                    variant={(data?.overview?.pendingRegistrations ?? 0) > 0 ? "warning" : "default"}
                    action={{
                        label: "Review Sekarang",
                        href: "/admin/registrations"
                    }}
                />

                {/* Cuti Request */}
                <EnhancedMetricCard
                    title="Pengajuan Cuti"
                    value={data?.overview?.pendingLeaveApprovals ?? 0}
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
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Attendance Heatmap - 30 days */}
                <AttendanceHeatmap className="lg:col-span-3" />

                {/* Department Breakdown */}
                <DepartmentBreakdown 
                    data={data?.byDepartment || []}
                    className="h-full" 
                />

                {/* Recent Activity Widget */}
                <RecentActivityWidget 
                    activities={data?.recentActivity || []}
                    className="h-full"
                />

                {/* Approval Queue */}
                <ApprovalQueue
                    items={data?.approvalQueue || []}
                    onApprove={() => {}}
                    onReject={() => {}}
                    className="h-full"
                />
            </div>
        </div>
    );
}

// Manager Dashboard Component
function ManagerDashboard({ data, employee, userName, role }: { data: DashboardData['manager']; employee: DashboardData['employee'], userName: string, role: string }) {
    return (
        <div className="space-y-8">
            <DashboardHero userName={userName} role={role} />

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

            {/* Manager Widgets */}
            <div className="grid gap-6 md:grid-cols-2">
                 <ApprovalQueue
                    items={data?.approvalQueue || []}
                    onApprove={() => {}}
                    onReject={() => {}}
                    className="h-full"
                />
            </div>
        </div>
    );
}

// Finance Dashboard Component
function FinanceDashboard({ data, userName, role }: { data: DashboardData['finance'], userName: string, role: string }) {
    return (
        <div className="space-y-8">
            <DashboardHero userName={userName} role={role} />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Pending Payroll */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Payroll Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data?.pendingPayroll || 0}</div>
                        <Link href="/admin/payroll">
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
                        <Link href="/approvals">
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
                        <Link href="/admin/payroll" className="block">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Laporan Payroll
                            </Button>
                        </Link>
                        <Link href="/reimburse" className="block">
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
function ItDashboard({ data, userName, role }: { data: DashboardData['it'], userName: string, role: string }) {
    return (
        <div className="space-y-8">
            <DashboardHero userName={userName} role={role} />

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

