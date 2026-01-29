// @ai:cl - Dedicated Super Admin Dashboard with multi-tenant visibility
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  Building2,
  Users,
  UserCheck,
  UserPlus,
  Activity,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Server,
  HardDrive,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
  Globe,
  FileText,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardHero } from "@/components/dashboard";

// Types
interface TenantHealth {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  counts: {
    users: number;
    employees: number;
    activeEmployees: number;
    branches: number;
    departments: number;
  };
  activity: {
    todayAttendance: number;
    attendanceRate: number;
    monthlyLogins: number;
    pendingApprovals: number;
    lastActivity: string | null;
  };
  health: "healthy" | "warning" | "critical";
}

interface SystemCheck {
  name: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  message?: string;
  details?: Record<string, unknown>;
}

interface DashboardData {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    totalEmployees: number;
    totalBranches: number;
  };
  today: {
    date: string;
    attendance: {
      present: number;
      late: number;
      absent: number;
    };
  };
  monthly: {
    month: string;
    logins: number;
  };
  tenants: Array<{
    id: string;
    name: string;
    domain: string | null;
    isActive: boolean;
    createdAt: string;
    users: number;
    employees: number;
    branches: number;
  }>;
  tenantHealth: Array<{
    tenantId: string;
    tenantName: string;
    tenantDomain: string | null;
    isActive: boolean;
    activeEmployees: number;
    todayAttendance: number;
    attendanceRate: number;
  }>;
  recentActivity: Array<{
    id: string;
    tenantId: string;
    actorId: string;
    action: string;
    objectType: string;
    timestamp: string;
  }>;
}

interface SystemHealthData {
  status: "healthy" | "degraded" | "down";
  timestamp: string;
  uptime: number;
  checks: SystemCheck[];
  metrics: {
    totalTenants: number;
    totalUsers: number;
    totalEmployees: number;
    totalAuditLogs: number;
    dbSize: string;
  };
  activity: {
    last24Hours: number;
    avgPerHour: number;
  };
  environment: {
    nodeVersion: string;
    platform: string;
    memory: {
      used: number;
      total: number;
    };
  };
}

interface TenantsData {
  summary: {
    total: number;
    active: number;
    inactive: number;
    healthy: number;
    warning: number;
    critical: number;
  };
  tenants: TenantHealth[];
}

export default function SuperAdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [tenantsData, setTenantsData] = useState<TenantsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, healthRes, tenantsRes] = await Promise.all([
        fetch("/api/dashboard/superadmin"),
        fetch("/api/dashboard/superadmin/system-health"),
        fetch("/api/dashboard/superadmin/tenants"),
      ]);

      const [dashboardJson, healthJson, tenantsJson] = await Promise.all([
        dashboardRes.json(),
        healthRes.json(),
        tenantsRes.json(),
      ]);

      if (dashboardJson.success) setDashboardData(dashboardJson.data);
      if (healthJson.success) setSystemHealth(healthJson.data);
      if (tenantsJson.success) setTenantsData(tenantsJson.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex items-center justify-between">
        <DashboardHero userName="Super Admin" role="SUPER_ADMIN" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* System Status Banner */}
      {systemHealth && (
        <SystemStatusBanner status={systemHealth.status} uptime={systemHealth.uptime} />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="tenants" className="gap-2">
            <Building2 className="h-4 w-4" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Server className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Tenants"
              value={dashboardData?.overview.totalTenants || 0}
              subtitle={`${dashboardData?.overview.activeTenants || 0} aktif`}
              icon={Building2}
              variant="default"
              href="/admin/superadmin/tenants"
            />
            <MetricCard
              title="Total Users"
              value={dashboardData?.overview.totalUsers || 0}
              subtitle={`${dashboardData?.overview.activeUsers || 0} aktif, ${dashboardData?.overview.pendingUsers || 0} pending`}
              icon={Users}
              variant="info"
              href="/admin/superadmin/users"
            />
            <MetricCard
              title="Total Karyawan"
              value={dashboardData?.overview.totalEmployees || 0}
              subtitle={`${dashboardData?.overview.totalBranches || 0} cabang`}
              icon={UserCheck}
              variant="success"
            />
            <MetricCard
              title="Login Bulan Ini"
              value={dashboardData?.monthly.logins || 0}
              subtitle={dashboardData?.monthly.month || "-"}
              icon={TrendingUp}
              variant="default"
            />
          </div>

          {/* Today's Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Kehadiran Hari Ini (Semua Tenant)
              </CardTitle>
              <CardDescription>{dashboardData?.today.date}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700">
                      {dashboardData?.today.attendance.present || 0}
                    </p>
                    <p className="text-sm text-green-600">Hadir</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-700">
                      {dashboardData?.today.attendance.late || 0}
                    </p>
                    <p className="text-sm text-yellow-600">Terlambat</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="p-3 rounded-full bg-red-100">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-700">
                      {dashboardData?.today.attendance.absent || 0}
                    </p>
                    <p className="text-sm text-red-600">Tidak Hadir</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Recent Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Aksi Cepat
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <QuickActionButton
                  icon={Building2}
                  label="Kelola Tenant"
                  description="Lihat dan kelola semua tenant"
                  href="/admin/superadmin/tenants"
                />
                <QuickActionButton
                  icon={Users}
                  label="Kelola Users"
                  description="Atur akses dan role pengguna"
                  href="/admin/superadmin/users"
                />
                <QuickActionButton
                  icon={FileText}
                  label="Audit Logs"
                  description="Lihat aktivitas sistem"
                  href="/admin/superadmin/audit-logs"
                />
                <QuickActionButton
                  icon={Settings}
                  label="System Settings"
                  description="Konfigurasi sistem"
                  href="/admin/settings"
                />
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Aktivitas Terbaru
                </CardTitle>
                <CardDescription>20 aktivitas terakhir dari semua tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {dashboardData?.recentActivity.slice(0, 10).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                  {(!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada aktivitas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-6">
          {/* Tenant Summary */}
          {tenantsData && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <SummaryCard
                label="Total"
                value={tenantsData.summary.total}
                icon={Building2}
              />
              <SummaryCard
                label="Aktif"
                value={tenantsData.summary.active}
                icon={CheckCircle2}
                variant="success"
              />
              <SummaryCard
                label="Nonaktif"
                value={tenantsData.summary.inactive}
                icon={XCircle}
                variant="danger"
              />
              <SummaryCard
                label="Sehat"
                value={tenantsData.summary.healthy}
                icon={CheckCircle2}
                variant="success"
              />
              <SummaryCard
                label="Warning"
                value={tenantsData.summary.warning}
                icon={AlertTriangle}
                variant="warning"
              />
              <SummaryCard
                label="Critical"
                value={tenantsData.summary.critical}
                icon={XCircle}
                variant="danger"
              />
            </div>
          )}

          {/* Tenant Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenantsData?.tenants.map((tenant) => (
              <TenantCard key={tenant.id} tenant={tenant} />
            ))}
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          {systemHealth && (
            <>
              {/* System Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Total Audit Logs"
                  value={systemHealth.metrics.totalAuditLogs.toLocaleString()}
                  subtitle="Records"
                  icon={FileText}
                />
                <MetricCard
                  title="Aktivitas 24 Jam"
                  value={systemHealth.activity.last24Hours}
                  subtitle={`~${systemHealth.activity.avgPerHour}/jam`}
                  icon={Activity}
                />
                <MetricCard
                  title="Memory Usage"
                  value={`${systemHealth.environment.memory.used} MB`}
                  subtitle={`of ${systemHealth.environment.memory.total} MB`}
                  icon={HardDrive}
                />
                <MetricCard
                  title="Uptime"
                  value={formatUptime(systemHealth.uptime)}
                  subtitle={systemHealth.environment.nodeVersion}
                  icon={Server}
                />
              </div>

              {/* Health Checks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Health Checks
                  </CardTitle>
                  <CardDescription>
                    Status terakhir: {new Date(systemHealth.timestamp).toLocaleString("id-ID")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {systemHealth.checks.map((check) => (
                      <HealthCheckCard key={check.name} check={check} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Components

function SystemStatusBanner({ status, uptime }: { status: string; uptime: number }) {
  const statusConfig = {
    healthy: {
      bg: "bg-green-50 border-green-200",
      icon: CheckCircle2,
      iconColor: "text-green-600",
      text: "Semua sistem berjalan normal",
      textColor: "text-green-700",
    },
    degraded: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: AlertTriangle,
      iconColor: "text-yellow-600",
      text: "Beberapa sistem mengalami penurunan performa",
      textColor: "text-yellow-700",
    },
    down: {
      bg: "bg-red-50 border-red-200",
      icon: XCircle,
      iconColor: "text-red-600",
      text: "Ada masalah pada sistem",
      textColor: "text-red-700",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.healthy;
  const Icon = config.icon;

  return (
    <div className={cn("flex items-center justify-between p-4 rounded-lg border", config.bg)}>
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", config.iconColor)} />
        <span className={cn("font-medium", config.textColor)}>{config.text}</span>
      </div>
      <span className="text-sm text-muted-foreground">Uptime: {formatUptime(uptime)}</span>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  href,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  variant?: "default" | "info" | "success" | "warning" | "danger";
  href?: string;
}) {
  const variantStyles = {
    default: "bg-slate-50 text-slate-600",
    info: "bg-blue-50 text-blue-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-yellow-50 text-yellow-600",
    danger: "bg-red-50 text-red-600",
  };

  const content = (
    <Card className={cn("transition-all duration-200", href && "hover:shadow-md cursor-pointer")}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className={cn("p-3 rounded-xl", variantStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "text-slate-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", variantStyles[variant])} />
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TenantCard({ tenant }: { tenant: TenantHealth }) {
  const healthConfig = {
    healthy: {
      badge: "bg-green-100 text-green-700",
      label: "Healthy",
    },
    warning: {
      badge: "bg-yellow-100 text-yellow-700",
      label: "Warning",
    },
    critical: {
      badge: "bg-red-100 text-red-700",
      label: "Critical",
    },
  };

  const config = healthConfig[tenant.health];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{tenant.name}</CardTitle>
            {tenant.domain && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <Globe className="h-3 w-3" />
                {tenant.domain}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Badge variant={tenant.isActive ? "default" : "secondary"}>
              {tenant.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
            <Badge className={config.badge}>{config.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-slate-50 rounded-lg">
            <p className="text-lg font-bold">{tenant.counts.users}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg">
            <p className="text-lg font-bold">{tenant.counts.activeEmployees}</p>
            <p className="text-xs text-muted-foreground">Karyawan</p>
          </div>
          <div className="p-2 bg-slate-50 rounded-lg">
            <p className="text-lg font-bold">{tenant.counts.branches}</p>
            <p className="text-xs text-muted-foreground">Cabang</p>
          </div>
        </div>

        {/* Attendance Rate */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Kehadiran Hari Ini</span>
            <span className="font-medium">{tenant.activity.attendanceRate}%</span>
          </div>
          <Progress value={tenant.activity.attendanceRate} className="h-2" />
        </div>

        {/* Activity */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {tenant.activity.pendingApprovals} pending approval
          </span>
          <span className="text-muted-foreground">
            {tenant.activity.monthlyLogins} login/bulan
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthCheckCard({ check }: { check: SystemCheck }) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    degraded: {
      icon: AlertTriangle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    down: {
      icon: XCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  };

  const config = statusConfig[check.status];
  const Icon = config.icon;

  const nameLabels: Record<string, string> = {
    database: "Database",
    tenants: "Tenants",
    data_integrity: "Data Integrity",
    audit_logging: "Audit Logging",
    security: "Security",
    payroll: "Payroll",
    storage: "Storage",
  };

  return (
    <div className={cn("flex items-center justify-between p-4 rounded-lg", config.bg)}>
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", config.color)} />
        <div>
          <p className="font-medium">{nameLabels[check.name] || check.name}</p>
          <p className="text-sm text-muted-foreground">{check.message}</p>
        </div>
      </div>
      {check.latency !== undefined && (
        <Badge variant="outline">{check.latency}ms</Badge>
      )}
    </div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group cursor-pointer">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-100 transition-colors">
            <Icon className="h-5 w-5 text-slate-600 group-hover:text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
      </div>
    </Link>
  );
}

function ActivityItem({ activity }: { activity: DashboardData["recentActivity"][0] }) {
  const actionLabels: Record<string, string> = {
    LOGIN: "Login",
    LOGOUT: "Logout",
    CREATE: "Membuat",
    UPDATE: "Mengubah",
    DELETE: "Menghapus",
    APPROVE: "Menyetujui",
    REJECT: "Menolak",
  };

  const objectLabels: Record<string, string> = {
    USER: "User",
    EMPLOYEE: "Karyawan",
    LEAVE_REQUEST: "Cuti",
    ATTENDANCE: "Absensi",
    REIMBURSEMENT: "Reimburse",
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
      <div className="p-2 rounded-full bg-blue-100">
        <Activity className="h-3 w-3 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          <span className="font-medium">{actionLabels[activity.action] || activity.action}</span>
          {" "}
          {objectLabels[activity.objectType] || activity.objectType}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(activity.timestamp).toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

// Helpers

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
