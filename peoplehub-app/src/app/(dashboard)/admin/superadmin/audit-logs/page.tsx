"use client";

// @ai:cl - SuperAdmin Audit Logs Page
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  User,
  Building2,
  Globe,
  Monitor,
  Activity,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

// Types
interface Tenant {
  id: string;
  name: string;
  code: string | null;
}

interface Actor {
  id: string;
  fullName: string;
  email: string;
  role: string;
  photoUrl?: string | null;
}

interface AuditLog {
  id: string;
  tenantId: string;
  tenant: Tenant | null;
  actorId: string | null;
  actor: Actor | null;
  action: string;
  objectType: string;
  objectId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuditLogDetail extends AuditLog {
  relatedObject: Record<string, unknown> | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Summary {
  todayCount: number;
  weekCount: number;
  totalCount: number;
  actionDistribution: Array<{ action: string; count: number }>;
  objectTypeDistribution: Array<{ objectType: string; count: number }>;
}

interface Filters {
  actions: string[];
  objectTypes: string[];
}

// Action badge styling
const actionStyles: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Create", color: "bg-green-100 text-green-800" },
  UPDATE: { label: "Update", color: "bg-blue-100 text-blue-800" },
  DELETE: { label: "Delete", color: "bg-red-100 text-red-800" },
  LOGIN: { label: "Login", color: "bg-purple-100 text-purple-800" },
  LOGOUT: { label: "Logout", color: "bg-gray-100 text-gray-800" },
  SUSPEND: { label: "Suspend", color: "bg-yellow-100 text-yellow-800" },
  REACTIVATE: { label: "Reactivate", color: "bg-teal-100 text-teal-800" },
  APPROVE: { label: "Approve", color: "bg-green-100 text-green-800" },
  REJECT: { label: "Reject", color: "bg-red-100 text-red-800" },
  CLOCK_IN: { label: "Clock In", color: "bg-indigo-100 text-indigo-800" },
  CLOCK_OUT: { label: "Clock Out", color: "bg-orange-100 text-orange-800" },
};

export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [availableFilters, setAvailableFilters] = useState<Filters>({ actions: [], objectTypes: [] });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedObjectType, setSelectedObjectType] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch tenants for filter
  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/superadmin/tenants?limit=100");
      if (res.ok) {
        const data = await res.json();
        setTenants(data.data.tenants || []);
      }
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    }
  }, []);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (search) params.set("search", search);
      if (selectedTenant !== "all") params.set("tenantId", selectedTenant);
      if (selectedAction !== "all") params.set("action", selectedAction);
      if (selectedObjectType !== "all") params.set("objectType", selectedObjectType);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/admin/superadmin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data.logs || []);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
        setAvailableFilters(data.data.filters);
      } else {
        toast({ title: "Gagal memuat audit logs", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedTenant, selectedAction, selectedObjectType, startDate, endDate, toast]);

  // Fetch log detail
  const fetchLogDetail = async (logId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/superadmin/audit-logs/${logId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLog(data.data);
      } else {
        toast({ title: "Gagal memuat detail log", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch log detail:", error);
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // View log detail
  const handleViewDetail = (log: AuditLog) => {
    fetchLogDetail(log.id);
    setDetailOpen(true);
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setSelectedTenant("all");
    setSelectedAction("all");
    setSelectedObjectType("all");
    setStartDate("");
    setEndDate("");
  };

  // Format datetime
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  // Check if filters are active
  const hasActiveFilters = search || selectedTenant !== "all" || selectedAction !== "all" || selectedObjectType !== "all" || startDate || endDate;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Pantau semua aktivitas sistem di seluruh tenant
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline" size="sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.todayCount}</div>
              <p className="text-xs text-muted-foreground">aktivitas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">7 Hari Terakhir</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.weekCount}</div>
              <p className="text-xs text-muted-foreground">aktivitas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Action</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.actionDistribution[0]?.action || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.actionDistribution[0]?.count || 0} kali
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Object</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.objectTypeDistribution[0]?.objectType || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.objectTypeDistribution[0]?.count || 0} aktivitas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="IP Address, Object ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tenant</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tenant</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Action</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Action</SelectItem>
                  {availableFilters.actions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {actionStyles[action]?.label || action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Object Type</Label>
              <Select value={selectedObjectType} onValueChange={setSelectedObjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Object</SelectItem>
                  {availableFilters.objectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tanggal</Label>
              <div className="flex gap-1">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Menampilkan {logs.length} dari {pagination.total} log
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Object</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-muted-foreground">Memuat data...</p>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Tidak ada log ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDateTime(log.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.actor ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={log.actor.photoUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(log.actor.fullName || log.actor.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{log.actor.fullName || log.actor.email}</p>
                              <p className="text-xs text-muted-foreground">{log.actor.role}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          actionStyles[log.action]?.color || "bg-gray-100 text-gray-800"
                        )}>
                          {actionStyles[log.action]?.label || log.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{log.objectType}</p>
                          {log.objectId && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {log.objectId.substring(0, 12)}...
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.tenant ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{log.tenant.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.ipAddress ? (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-mono">{log.ipAddress}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Audit Log</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedLog ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Informasi Umum</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Waktu</span>
                        <p className="font-medium">{formatDateTime(selectedLog.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Action</span>
                        <p>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            actionStyles[selectedLog.action]?.color || "bg-gray-100 text-gray-800"
                          )}>
                            {actionStyles[selectedLog.action]?.label || selectedLog.action}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Object Type</span>
                        <p className="font-medium">{selectedLog.objectType}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <span className="text-muted-foreground">Object ID</span>
                        <p className="font-medium font-mono text-xs">{selectedLog.objectId || "-"}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actor Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Actor</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLog.actor ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedLog.actor.photoUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(selectedLog.actor.fullName || selectedLog.actor.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedLog.actor.fullName}</p>
                        <p className="text-sm text-muted-foreground">{selectedLog.actor.email}</p>
                        <Badge variant="outline" className="mt-1">{selectedLog.actor.role}</Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">System Action</p>
                  )}
                </CardContent>
              </Card>

              {/* Tenant Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tenant</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedLog.tenant ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedLog.tenant.name}</span>
                      {selectedLog.tenant.code && (
                        <Badge variant="outline">{selectedLog.tenant.code}</Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">-</p>
                  )}
                </CardContent>
              </Card>

              {/* Connection Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Connection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">IP Address:</span>
                      <span className="font-mono">{selectedLog.ipAddress || "-"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">User Agent:</span>
                      <span className="text-xs break-all">{selectedLog.userAgent || "-"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Changes */}
              {(selectedLog.beforeData || selectedLog.afterData) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Data Changes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Before</Label>
                        <ScrollArea className="h-[200px] rounded border p-2 mt-1">
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {selectedLog.beforeData
                              ? JSON.stringify(selectedLog.beforeData, null, 2)
                              : "null"}
                          </pre>
                        </ScrollArea>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">After</Label>
                        <ScrollArea className="h-[200px] rounded border p-2 mt-1">
                          <pre className="text-xs font-mono whitespace-pre-wrap">
                            {selectedLog.afterData
                              ? JSON.stringify(selectedLog.afterData, null, 2)
                              : "null"}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Related Object */}
              {selectedLog.relatedObject && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Related Object</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[150px] rounded border p-2">
                      <pre className="text-xs font-mono whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.relatedObject, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Data tidak ditemukan</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
