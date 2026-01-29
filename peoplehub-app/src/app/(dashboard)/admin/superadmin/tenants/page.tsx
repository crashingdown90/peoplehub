// @ai:cl - SuperAdmin Tenant Management Page
"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Power,
  Trash2,
  Users,
  UserCheck,
  Globe,
  Calendar,
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { fetchWithCsrf } from "@/lib/api-client";

// Types
interface Tenant {
  id: string;
  name: string;
  domain: string | null;
  code: string | null;
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  counts: {
    users: number;
    employees: number;
    branches: number;
    departments: number;
    positions: number;
    activeUsers: number;
    activeEmployees: number;
  };
  stats: {
    todayAttendance: number;
    pendingApprovals: number;
    attendanceRate: number;
  };
}

interface TenantDetail extends Tenant {
  counts: Tenant["counts"] & {
    shifts: number;
    leaveTypes: number;
    holidays: number;
    announcements: number;
  };
  stats: Tenant["stats"] & {
    activeUsers: number;
    activeEmployees: number;
    monthlyLogins: number;
  };
  branches: Array<{ id: string; name: string; code: string | null; isActive: boolean }>;
  departments: Array<{ id: string; name: string; code: string | null }>;
  recentUsers: Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    createdAt: string;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function TenantManagementPage() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Selected tenant
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    code: "",
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Fetch tenants
  const fetchTenants = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        status: statusFilter,
      });
      if (search) params.set("search", search);

      const res = await fetchWithCsrf(`/api/admin/superadmin/tenants?${params}`);
      const json = await res.json();

      if (json.success) {
        setTenants(json.data.tenants);
        setPagination(json.data.pagination);
      } else {
        toast({
          title: "Error",
          description: json.error?.message || "Gagal memuat data tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch tenants error:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data tenant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, statusFilter, search, toast]);

  // Fetch tenant detail
  const fetchTenantDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/superadmin/tenants/${id}`);
      const json = await res.json();

      if (json.success) {
        setTenantDetail(json.data);
      } else {
        toast({
          title: "Error",
          description: json.error?.message || "Gagal memuat detail tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch tenant detail error:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination((prev) => ({ ...prev, page: 1 }));
      } else {
        fetchTenants();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Create tenant
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Nama tenant wajib diisi", variant: "destructive" });
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetchWithCsrf("/api/admin/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain || null,
          code: formData.code || null,
          isActive: formData.isActive,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast({ title: "Berhasil", description: "Tenant berhasil dibuat" });
        setCreateOpen(false);
        resetForm();
        fetchTenants(false);
      } else {
        toast({
          title: "Error",
          description: json.error?.message || "Gagal membuat tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create tenant error:", error);
      toast({ title: "Error", description: "Gagal membuat tenant", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  // Update tenant
  const handleUpdate = async () => {
    if (!selectedTenant || !formData.name.trim()) {
      toast({ title: "Error", description: "Nama tenant wajib diisi", variant: "destructive" });
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetchWithCsrf(`/api/admin/superadmin/tenants/${selectedTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain || null,
          code: formData.code || null,
          isActive: formData.isActive,
        }),
      });

      const json = await res.json();

      if (json.success) {
        toast({ title: "Berhasil", description: "Tenant berhasil diperbarui" });
        setEditOpen(false);
        resetForm();
        fetchTenants(false);
      } else {
        toast({
          title: "Error",
          description: json.error?.message || "Gagal memperbarui tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update tenant error:", error);
      toast({ title: "Error", description: "Gagal memperbarui tenant", variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle tenant active status
  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const res = await fetchWithCsrf(`/api/admin/superadmin/tenants/${tenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !tenant.isActive }),
      });

      const json = await res.json();

      if (json.success) {
        toast({
          title: "Berhasil",
          description: `Tenant ${!tenant.isActive ? "diaktifkan" : "dinonaktifkan"}`,
        });
        fetchTenants(false);
      } else {
        toast({
          title: "Error",
          description: json.error?.message || "Gagal mengubah status tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Toggle tenant error:", error);
      toast({ title: "Error", description: "Gagal mengubah status tenant", variant: "destructive" });
    }
  };

  // Delete tenant
  const handleDelete = async () => {
    if (!selectedTenant) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/superadmin/tenants/${selectedTenant.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (json.success) {
        toast({ title: "Berhasil", description: "Tenant berhasil dinonaktifkan" });
        setDeleteDialogOpen(false);
        setSelectedTenant(null);
        fetchTenants(false);
      } else {
        toast({
          title: "Error",
          description: json.error?.message || "Gagal menghapus tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete tenant error:", error);
      toast({ title: "Error", description: "Gagal menghapus tenant", variant: "destructive" });
    }
  };

  // Open edit dialog
  const openEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      domain: tenant.domain || "",
      code: tenant.code || "",
      isActive: tenant.isActive,
    });
    setEditOpen(true);
  };

  // Open detail dialog
  const openDetail = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDetailOpen(true);
    fetchTenantDetail(tenant.id);
  };

  // Open delete dialog
  const openDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteDialogOpen(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", domain: "", code: "", isActive: true });
    setSelectedTenant(null);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenant Management</h1>
          <p className="text-muted-foreground">Kelola semua tenant di sistem</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTenants(false)}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tenant
              </Button>
            </DialogTrigger>
            <TenantFormDialog
              title="Tambah Tenant Baru"
              description="Buat tenant baru untuk perusahaan"
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleCreate}
              loading={formLoading}
              submitLabel="Buat Tenant"
            />
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, domain, atau kode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tenants.map((tenant) => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            onEdit={() => openEdit(tenant)}
            onView={() => openDetail(tenant)}
            onToggleActive={() => handleToggleActive(tenant)}
            onDelete={() => openDelete(tenant)}
          />
        ))}
      </div>

      {/* Empty State */}
      {tenants.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Tidak ada tenant</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {search ? "Tidak ditemukan tenant yang sesuai dengan pencarian" : "Belum ada tenant yang terdaftar"}
            </p>
            {!search && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tenant Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} tenant
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <TenantFormDialog
          title="Edit Tenant"
          description="Perbarui informasi tenant"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
          loading={formLoading}
          submitLabel="Simpan Perubahan"
        />
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <TenantDetailDialog tenant={tenantDetail} loading={loadingDetail} />
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Nonaktifkan Tenant?
            </DialogTitle>
            <DialogDescription>
              Tenant <strong>{selectedTenant?.name}</strong> akan dinonaktifkan. User tidak akan bisa login ke tenant ini.
              {selectedTenant && (selectedTenant.counts.users > 0 || selectedTenant.counts.employees > 0) && (
                <span className="block mt-2 text-yellow-600">
                  Perhatian: Tenant ini memiliki {selectedTenant.counts.users} user dan {selectedTenant.counts.employees} karyawan.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Nonaktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Components

function TenantCard({
  tenant,
  onEdit,
  onView,
  onToggleActive,
  onDelete,
}: {
  tenant: Tenant;
  onEdit: () => void;
  onView: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{tenant.name}</CardTitle>
            {tenant.domain && (
              <CardDescription className="flex items-center gap-1 mt-1 truncate">
                <Globe className="h-3 w-3 flex-shrink-0" />
                {tenant.domain}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={tenant.isActive ? "default" : "secondary"}>
              {tenant.isActive ? "Aktif" : "Nonaktif"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  Lihat Detail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onToggleActive}>
                  <Power className="h-4 w-4 mr-2" />
                  {tenant.isActive ? "Nonaktifkan" : "Aktifkan"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-slate-500" />
            <p className="text-lg font-bold">{tenant.counts.activeUsers}</p>
            <p className="text-xs text-muted-foreground">Users</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <UserCheck className="h-4 w-4 mx-auto mb-1 text-slate-500" />
            <p className="text-lg font-bold">{tenant.counts.activeEmployees}</p>
            <p className="text-xs text-muted-foreground">Karyawan</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <Activity className="h-4 w-4 mx-auto mb-1 text-slate-500" />
            <p className="text-lg font-bold">{tenant.stats.attendanceRate}%</p>
            <p className="text-xs text-muted-foreground">Kehadiran</p>
          </div>
        </div>

        {/* Code & Created */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {tenant.code && <span>Kode: {tenant.code}</span>}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(tenant.createdAt).toLocaleDateString("id-ID")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TenantFormDialog({
  title,
  description,
  formData,
  setFormData,
  onSubmit,
  loading,
  submitLabel,
}: {
  title: string;
  description: string;
  formData: { name: string; domain: string; code: string; isActive: boolean };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  onSubmit: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nama Tenant *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="PT. Nama Perusahaan"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="domain">Domain</Label>
          <Input
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            placeholder="perusahaan.com"
          />
          <p className="text-xs text-muted-foreground">Domain unik untuk identifikasi tenant</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">Kode Tenant</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="KODE"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground">Kode singkat (max 20 karakter)</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="isActive">Status Aktif</Label>
            <p className="text-xs text-muted-foreground">Tenant aktif dapat diakses user</p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={loading}>
          {loading ? "Menyimpan..." : submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function TenantDetailDialog({
  tenant,
  loading,
}: {
  tenant: TenantDetail | null;
  loading: boolean;
}) {
  if (loading || !tenant) {
    return (
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detail Tenant</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {tenant.name}
        </DialogTitle>
        <DialogDescription className="flex items-center gap-2">
          {tenant.domain && (
            <>
              <Globe className="h-3 w-3" />
              {tenant.domain}
            </>
          )}
          {tenant.code && (
            <Badge variant="outline" className="ml-2">
              {tenant.code}
            </Badge>
          )}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="overview" className="mt-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="structure">Struktur</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <StatBox label="Users" value={tenant.counts.users} subValue={`${tenant.stats.activeUsers} aktif`} />
            <StatBox label="Karyawan" value={tenant.counts.employees} subValue={`${tenant.stats.activeEmployees} aktif`} />
            <StatBox label="Cabang" value={tenant.counts.branches} />
            <StatBox label="Departemen" value={tenant.counts.departments} />
          </div>

          {/* Activity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Aktivitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Kehadiran Hari Ini</p>
                  <p className="font-semibold">{tenant.stats.todayAttendance} ({tenant.stats.attendanceRate}%)</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Login Bulan Ini</p>
                  <p className="font-semibold">{tenant.stats.monthlyLogins}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Pending Approval</p>
                  <p className="font-semibold">{tenant.stats.pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Dibuat</p>
              <p>{new Date(tenant.createdAt).toLocaleString("id-ID")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Terakhir Diperbarui</p>
              <p>{new Date(tenant.updatedAt).toLocaleString("id-ID")}</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4 mt-4">
          {/* Branches */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cabang ({tenant.counts.branches})</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.branches.length > 0 ? (
                <div className="space-y-2">
                  {tenant.branches.map((branch) => (
                    <div key={branch.id} className="flex items-center justify-between text-sm">
                      <span>{branch.name}</span>
                      <div className="flex items-center gap-2">
                        {branch.code && <Badge variant="outline">{branch.code}</Badge>}
                        {branch.isActive ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada cabang</p>
              )}
            </CardContent>
          </Card>

          {/* Departments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Departemen ({tenant.counts.departments})</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.departments.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tenant.departments.map((dept) => (
                    <Badge key={dept.id} variant="secondary">
                      {dept.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada departemen</p>
              )}
            </CardContent>
          </Card>

          {/* Other Counts */}
          <div className="grid grid-cols-4 gap-3">
            <StatBox label="Posisi" value={tenant.counts.positions} />
            <StatBox label="Shift" value={tenant.counts.shifts} />
            <StatBox label="Tipe Cuti" value={tenant.counts.leaveTypes} />
            <StatBox label="Pengumuman" value={tenant.counts.announcements} />
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">User Terbaru</CardTitle>
            </CardHeader>
            <CardContent>
              {tenant.recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {tenant.recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{user.fullName || user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{user.role}</Badge>
                        <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada user</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

function StatBox({
  label,
  value,
  subValue,
}: {
  label: string;
  value: number;
  subValue?: string;
}) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
