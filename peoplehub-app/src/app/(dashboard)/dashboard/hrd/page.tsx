"use client";

// @ai:cl - HRD Dashboard with employee statistics
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  CalendarRange,
  Building2,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  FileText,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardHero } from "@/components/dashboard";

// Types
interface CompanyStats {
  totalEmployees: number;
  pendingRegistrations: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  todayLeave: number;
  attendanceRate: number;
}

interface MonthStats {
  attendanceRate: number;
  lateCount: number;
  monthName: string;
}

interface PendingApprovals {
  registrations: number;
  leave: number;
  total: number;
}

interface PendingRegistration {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  registeredAt: string;
}

interface PendingLeave {
  id: string;
  employee: string;
  employeeNumber: string;
  department: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
}

interface ContractExpiring {
  id: string;
  fullName: string;
  employeeNumber: string;
  department: string | null;
  position: string | null;
  endDate: string;
  daysRemaining: number;
}

interface DepartmentStat {
  department: string;
  count: number;
}

interface BranchStat {
  branch: string;
  count: number;
}

interface Announcement {
  id: string;
  title: string;
  publishedAt: string;
}

interface DashboardData {
  companyStats: CompanyStats;
  monthStats: MonthStats;
  pendingApprovals: PendingApprovals;
  pendingRegistrationsList: PendingRegistration[];
  pendingLeaveList: PendingLeave[];
  contractExpiring: ContractExpiring[];
  employeeDistribution: {
    byDepartment: DepartmentStat[];
    byBranch: BranchStat[];
  };
  recentAnnouncements: Announcement[];
}

export default function HRDDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/hrd");
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      } else {
        const json = await res.json();
        setError(json.error?.message || "Gagal memuat data");
      }
    } catch (err) {
      console.error("Failed to fetch HRD dashboard:", err);
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <DashboardHero userName="HRD Manager" role="HRD" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium mb-2">Gagal Memuat Data</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData}>Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const totalDepartmentEmployees = data.employeeDistribution.byDepartment.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <DashboardHero userName="HRD Manager" role="HRD" />
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Karyawan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.companyStats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Karyawan aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kehadiran Hari Ini</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.companyStats.todayPresent}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={data.companyStats.attendanceRate} className="h-2" />
              <span className="text-xs text-muted-foreground">{data.companyStats.attendanceRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terlambat Hari Ini</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.companyStats.todayLate}</div>
            <p className="text-xs text-muted-foreground">
              Cuti: {data.companyStats.todayLeave} | Absen: {data.companyStats.todayAbsent}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.pendingApprovals.total}</div>
            <p className="text-xs text-muted-foreground">
              Registrasi: {data.pendingApprovals.registrations} | Cuti: {data.pendingApprovals.leave}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Month Stats & Contract Alerts */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Statistik {data.monthStats.monthName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Rata-rata Kehadiran</span>
              <span className="font-medium">{data.monthStats.attendanceRate}%</span>
            </div>
            <Progress value={data.monthStats.attendanceRate} className="h-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Terlambat</span>
              <Badge variant="outline">{data.monthStats.lateCount} kali</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Kontrak Akan Berakhir
              </CardTitle>
              <CardDescription>30 hari ke depan</CardDescription>
            </div>
            {data.contractExpiring.length > 0 && (
              <Badge variant="destructive">{data.contractExpiring.length}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {data.contractExpiring.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>Tidak ada kontrak yang akan berakhir</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.contractExpiring.slice(0, 5).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{emp.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.department} - {emp.position}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={emp.daysRemaining <= 7 ? "destructive" : "outline"}>
                        {emp.daysRemaining} hari lagi
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(emp.endDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Pending Items */}
      <Tabs defaultValue="registrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="registrations" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Registrasi Pending
            {data.pendingApprovals.registrations > 0 && (
              <Badge variant="secondary" className="ml-1">{data.pendingApprovals.registrations}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            Cuti Pending
            {data.pendingApprovals.leave > 0 && (
              <Badge variant="secondary" className="ml-1">{data.pendingApprovals.leave}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <Building2 className="h-4 w-4" />
            Distribusi Karyawan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registrations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Registrasi Menunggu Persetujuan</CardTitle>
                <CardDescription>User baru yang mendaftar</CardDescription>
              </div>
              <Link href="/admin/registrations">
                <Button variant="outline" size="sm">
                  Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.pendingRegistrationsList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Tidak ada registrasi pending</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Tanggal Daftar</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pendingRegistrationsList.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.fullName || "-"}</TableCell>
                        <TableCell>{reg.email}</TableCell>
                        <TableCell>{reg.phone || "-"}</TableCell>
                        <TableCell>{formatDateTime(reg.registeredAt)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/registrations?id=${reg.id}`}>
                            <Button variant="ghost" size="sm">Review</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pengajuan Cuti Menunggu Persetujuan</CardTitle>
                <CardDescription>Cuti yang perlu di-approve</CardDescription>
              </div>
              <Link href="/approvals">
                <Button variant="outline" size="sm">
                  Lihat Semua <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.pendingLeaveList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Tidak ada pengajuan cuti pending</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Departemen</TableHead>
                      <TableHead>Jenis Cuti</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pendingLeaveList.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{leave.employee}</p>
                            <p className="text-xs text-muted-foreground">{leave.employeeNumber}</p>
                          </div>
                        </TableCell>
                        <TableCell>{leave.department || "-"}</TableCell>
                        <TableCell>{leave.leaveType}</TableCell>
                        <TableCell>
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </TableCell>
                        <TableCell>{leave.totalDays} hari</TableCell>
                        <TableCell>
                          <Badge variant={leave.status === "PENDING" ? "outline" : "secondary"}>
                            {leave.status === "PENDING" ? "Pending" : "Approved Manager"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid gap-4 md:grid-cols-2">
            {/* By Department */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Per Departemen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.employeeDistribution.byDepartment.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {data.employeeDistribution.byDepartment.map((dept, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{dept.department}</span>
                          <span className="text-sm font-medium">{dept.count}</span>
                        </div>
                        <Progress
                          value={totalDepartmentEmployees > 0 ? (dept.count / totalDepartmentEmployees) * 100 : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Branch */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Per Cabang
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.employeeDistribution.byBranch.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Tidak ada data</p>
                ) : (
                  <div className="space-y-3">
                    {data.employeeDistribution.byBranch.map((branch, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{branch.branch}</span>
                        </div>
                        <Badge variant="outline">{branch.count} orang</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Announcements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Pengumuman Terbaru
            </CardTitle>
          </div>
          <Link href="/admin/announcements">
            <Button variant="ghost" size="sm">
              Kelola <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentAnnouncements.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Belum ada pengumuman</p>
          ) : (
            <div className="space-y-3">
              {data.recentAnnouncements.map((ann) => (
                <div key={ann.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{ann.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ann.publishedAt ? formatDateTime(ann.publishedAt) : "-"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
