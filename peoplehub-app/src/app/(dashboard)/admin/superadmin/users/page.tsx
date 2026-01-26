"use client";

// @ai:cl - SuperAdmin User Management Page
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
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Power,
  PowerOff,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Shield,
  Activity,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";

// Types
interface User {
  id: string;
  tenantId: string;
  email: string;
  phone: string | null;
  fullName: string;
  status: "PENDING" | "ACTIVE" | "APPROVED" | "REJECTED" | "SUSPENDED";
  role: "EMPLOYEE" | "MANAGER" | "HRD" | "FINANCE" | "IT_OPS" | "SUPER_ADMIN";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  photoUrl: string | null;
  tenant: {
    id: string;
    name: string;
    code: string | null;
  };
  employee: {
    id: string;
    employeeCode: string | null;
    employeeNumber: string;
    department: { id: string; name: string } | null;
    position: { id: string; name: string } | null;
    branch: { id: string; name: string } | null;
  } | null;
}

interface UserDetail extends User {
  emailVerifiedAt: string | null;
  deletedAt: string | null;
  gender: string | null;
  birthPlace: string | null;
  birthDate: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolder: string | null;
  nik: string | null;
  npwp: string | null;
  address: string | null;
  ktpPhotoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  tenant: {
    id: string;
    name: string;
    code: string | null;
    domain: string | null;
    isActive: boolean;
  };
  employee: {
    id: string;
    employeeCode: string | null;
    employeeNumber: string;
    status: string;
    employmentType: string;
    startDate: string | null;
    endDate: string | null;
    department: { id: string; name: string; code: string | null } | null;
    position: { id: string; name: string; code: string | null; level: number | null } | null;
    branch: { id: string; name: string; code: string | null } | null;
    manager: {
      id: string;
      fullName: string;
      employeeCode: string | null;
      user: { email: string };
    } | null;
  } | null;
  activity: {
    loginCountLast30Days: number;
    unreadNotifications: number;
    recentAuditLogs: Array<{
      id: string;
      action: string;
      objectType: string;
      objectId: string | null;
      createdAt: string;
      ipAddress: string | null;
    }>;
  };
  attendanceStats: {
    totalAttendanceThisMonth: number;
    lateCountThisMonth: number;
    pendingLeaveRequests: number;
  } | null;
}

interface Tenant {
  id: string;
  name: string;
  code: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Summary {
  totalUsers: number;
  activeUsers: number;
  pendingUsers: number;
  suspendedUsers: number;
  roleDistribution: Record<string, number>;
}

// Status badge styling
const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "outline" },
  ACTIVE: { label: "Aktif", variant: "default" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
  SUSPENDED: { label: "Suspended", variant: "secondary" },
};

// Role badge styling
const roleStyles: Record<string, { label: string; color: string }> = {
  EMPLOYEE: { label: "Karyawan", color: "bg-gray-100 text-gray-800" },
  MANAGER: { label: "Manager", color: "bg-blue-100 text-blue-800" },
  HRD: { label: "HRD", color: "bg-green-100 text-green-800" },
  FINANCE: { label: "Finance", color: "bg-yellow-100 text-yellow-800" },
  IT_OPS: { label: "IT Ops", color: "bg-purple-100 text-purple-800" },
  SUPER_ADMIN: { label: "Super Admin", color: "bg-red-100 text-red-800" },
};

export default function UserManagementPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

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

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (search) params.set("search", search);
      if (selectedTenant !== "all") params.set("tenantId", selectedTenant);
      if (selectedRole !== "all") params.set("role", selectedRole);
      if (selectedStatus !== "all") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/superadmin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data.users || []);
        setPagination(data.data.pagination);
        setSummary(data.data.summary);
      } else {
        toast({ title: "Gagal memuat data user", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, selectedTenant, selectedRole, selectedStatus, toast]);

  // Fetch user detail
  const fetchUserDetail = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/superadmin/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserDetail(data.data);
      } else {
        toast({ title: "Gagal memuat detail user", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to fetch user detail:", error);
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Open edit dialog
  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setEditForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  // Open detail dialog
  const handleViewDetail = (user: User) => {
    setUserToEdit(user);
    fetchUserDetail(user.id);
    setDetailDialogOpen(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!userToEdit) return;

    try {
      const res = await fetch(`/api/admin/superadmin/users/${userToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast({ title: "User berhasil diperbarui" });
        setEditDialogOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: data.error?.message || "Gagal memperbarui user", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    }
  };

  // Handle suspend user
  const handleSuspend = async () => {
    if (!userToEdit) return;

    try {
      const res = await fetch(`/api/admin/superadmin/users/${userToEdit.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "User berhasil dinonaktifkan" });
        setSuspendDialogOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: data.error?.message || "Gagal menonaktifkan user", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to suspend user:", error);
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    }
  };

  // Handle reactivate user
  const handleReactivate = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/superadmin/users/${user.id}`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast({ title: "User berhasil diaktifkan kembali" });
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: data.error?.message || "Gagal mengaktifkan user", variant: "destructive" });
      }
    } catch (error) {
      console.error("Failed to reactivate user:", error);
      toast({ title: "Terjadi kesalahan", variant: "destructive" });
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format datetime
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get initials
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </h1>
          <p className="text-muted-foreground">
            Kelola semua user di seluruh tenant
          </p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.activeUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.pendingUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.suspendedUsers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Cari User</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama, email, atau telepon..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-[200px]">
              <Label className="text-xs text-muted-foreground">Tenant</Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tenant" />
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
            <div className="w-full md:w-[150px]">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Role</SelectItem>
                  {Object.entries(roleStyles).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-[150px]">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {Object.entries(statusStyles).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar User</CardTitle>
          <CardDescription>
            Menampilkan {users.length} dari {pagination.total} user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Login Terakhir</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
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
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Tidak ada user ditemukan</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoUrl || undefined} />
                            <AvatarFallback>{getInitials(user.fullName || user.email)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.fullName || "-"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{user.tenant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn("px-2 py-1 rounded-full text-xs font-medium", roleStyles[user.role]?.color)}>
                          {roleStyles[user.role]?.label || user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusStyles[user.status]?.variant || "outline"}>
                          {statusStyles[user.status]?.label || user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.employee?.department?.name || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDateTime(user.lastLoginAt)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(user)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === "SUSPENDED" ? (
                              <DropdownMenuItem onClick={() => handleReactivate(user)}>
                                <Power className="h-4 w-4 mr-2 text-green-600" />
                                <span className="text-green-600">Aktifkan</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setUserToEdit(user);
                                  setSuspendDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <PowerOff className="h-4 w-4 mr-2" />
                                Nonaktifkan
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Ubah data user {userToEdit?.fullName || userToEdit?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                value={editForm.fullName}
                onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleStyles).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusStyles).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit}>
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : userDetail ? (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informasi</TabsTrigger>
                <TabsTrigger value="employee">Karyawan</TabsTrigger>
                <TabsTrigger value="activity">Aktivitas</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* User Profile */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userDetail.photoUrl || undefined} />
                    <AvatarFallback className="text-lg">{getInitials(userDetail.fullName || userDetail.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{userDetail.fullName || "-"}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", roleStyles[userDetail.role]?.color)}>
                        {roleStyles[userDetail.role]?.label}
                      </span>
                      <Badge variant={statusStyles[userDetail.status]?.variant}>
                        {statusStyles[userDetail.status]?.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Kontak</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{userDetail.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{userDetail.phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{userDetail.address || "-"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tenant Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tenant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{userDetail.tenant.name}</span>
                        {userDetail.tenant.code && (
                          <Badge variant="outline">{userDetail.tenant.code}</Badge>
                        )}
                      </div>
                      <Badge variant={userDetail.tenant.isActive ? "default" : "secondary"}>
                        {userDetail.tenant.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Data Pribadi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">NIK</span>
                        <p className="font-medium">{userDetail.nik || "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">NPWP</span>
                        <p className="font-medium">{userDetail.npwp || "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tempat Lahir</span>
                        <p className="font-medium">{userDetail.birthPlace || "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tanggal Lahir</span>
                        <p className="font-medium">{formatDate(userDetail.birthDate)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Gender</span>
                        <p className="font-medium">{userDetail.gender || "-"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dibuat</span>
                        <p className="font-medium">{formatDate(userDetail.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="employee" className="space-y-4 mt-4">
                {userDetail.employee ? (
                  <>
                    {/* Employment Info */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Informasi Pekerjaan</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Kode Karyawan</span>
                            <p className="font-medium">{userDetail.employee.employeeCode || "-"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">No. Karyawan</span>
                            <p className="font-medium">{userDetail.employee.employeeNumber}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status</span>
                            <Badge variant="outline">{userDetail.employee.status}</Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tipe</span>
                            <p className="font-medium">{userDetail.employee.employmentType}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tanggal Masuk</span>
                            <p className="font-medium">{formatDate(userDetail.employee.startDate)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tanggal Keluar</span>
                            <p className="font-medium">{formatDate(userDetail.employee.endDate)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Organization */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Organisasi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Cabang</span>
                              <p className="font-medium">{userDetail.employee.branch?.name || "-"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Departemen</span>
                              <p className="font-medium">{userDetail.employee.department?.name || "-"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Posisi</span>
                              <p className="font-medium">{userDetail.employee.position?.name || "-"}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <span className="text-muted-foreground">Manager</span>
                              <p className="font-medium">{userDetail.employee.manager?.fullName || "-"}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Attendance Stats */}
                    {userDetail.attendanceStats && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Statistik Kehadiran</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-2xl font-bold">{userDetail.attendanceStats.totalAttendanceThisMonth}</p>
                              <p className="text-xs text-muted-foreground">Kehadiran Bulan Ini</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-2xl font-bold text-yellow-600">{userDetail.attendanceStats.lateCountThisMonth}</p>
                              <p className="text-xs text-muted-foreground">Terlambat</p>
                            </div>
                            <div className="text-center p-3 bg-muted rounded-lg">
                              <p className="text-2xl font-bold text-blue-600">{userDetail.attendanceStats.pendingLeaveRequests}</p>
                              <p className="text-xs text-muted-foreground">Cuti Pending</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">User ini belum memiliki data karyawan</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-4 mt-4">
                {/* Activity Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Login 30 Hari</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDetail.activity.loginCountLast30Days}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Notifikasi Belum Dibaca</CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{userDetail.activity.unreadNotifications}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Last Login */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Login Terakhir</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDateTime(userDetail.lastLoginAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Audit Logs */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Aktivitas Terbaru</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userDetail.activity.recentAuditLogs.length > 0 ? (
                      <div className="space-y-3">
                        {userDetail.activity.recentAuditLogs.map((log) => (
                          <div key={log.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                            <div>
                              <p className="text-sm font-medium">{log.action}</p>
                              <p className="text-xs text-muted-foreground">
                                {log.objectType} {log.objectId && `(${log.objectId.substring(0, 8)}...)`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt)}</p>
                              {log.ipAddress && (
                                <p className="text-xs text-muted-foreground">{log.ipAddress}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Tidak ada aktivitas</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Data tidak ditemukan</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Nonaktifkan User?
            </DialogTitle>
            <DialogDescription>
              User <strong>{userToEdit?.fullName || userToEdit?.email}</strong> akan dinonaktifkan dan tidak bisa login.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              Nonaktifkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
