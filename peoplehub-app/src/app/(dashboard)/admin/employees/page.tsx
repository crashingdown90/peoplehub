"use client";

// @ai:cx - Enhanced Employee List with filters and Super Admin cross-tenant support

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Users, Search, Building, Briefcase, Mail, Loader2,
    Plus, Filter, X, ChevronDown, Building2
} from "lucide-react";

interface Employee {
    id: string;
    employeeNumber: string;
    fullName: string;
    phone: string;
    employmentType: string;
    workMode: string;
    status: string;
    startDate: string;
    branch?: { id: string; name: string };
    department?: { id: string; name: string };
    position?: { name: string };
    user?: { email: string; role: string; photoUrl?: string | null };
    tenant?: { id: string; name: string };
}

interface FilterOption {
    id: string;
    name: string;
}

interface UserSession {
    role: string;
    tenantId: string;
}

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);

    // User session
    const [userSession, setUserSession] = useState<UserSession | null>(null);
    const isSuperAdmin = userSession?.role === "SUPER_ADMIN";

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [departments, setDepartments] = useState<FilterOption[]>([]);
    const [branches, setBranches] = useState<FilterOption[]>([]);
    const [tenants, setTenants] = useState<FilterOption[]>([]);
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedTenant, setSelectedTenant] = useState("");

    // Fetch user session
    useEffect(() => {
        async function fetchSession() {
            try {
                const res = await fetch("/api/auth/me");
                const data = await res.json();
                if (data.success && data.data) {
                    setUserSession({ role: data.data.role, tenantId: data.data.tenantId });
                }
            } catch (err) {
                console.error("Error fetching session:", err);
            }
        }
        fetchSession();
    }, []);

    // Fetch filter options (including tenants for Super Admin)
    useEffect(() => {
        async function fetchFilterOptions() {
            try {
                const promises: Promise<Response>[] = [
                    fetch("/api/admin/departments"),
                    fetch("/api/admin/branches"),
                ];

                // Fetch tenants only for Super Admin
                if (isSuperAdmin) {
                    promises.push(fetch("/api/admin/superadmin/tenants?limit=100"));
                }

                const responses = await Promise.all(promises);
                const [deptData, branchData, tenantData] = await Promise.all(
                    responses.map(r => r.json())
                );

                if (deptData.success) setDepartments(deptData.data);
                if (branchData.success) setBranches(branchData.data);
                if (tenantData?.success && tenantData.data?.tenants) {
                    setTenants(tenantData.data.tenants.map((t: { id: string; name: string }) => ({
                        id: t.id,
                        name: t.name,
                    })));
                }
            } catch (err) {
                console.error("Error fetching filter options:", err);
            }
        }
        if (userSession) {
            fetchFilterOptions();
        }
    }, [userSession, isSuperAdmin]);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                ...(activeSearch ? { search: activeSearch } : {}),
                ...(selectedDepartment ? { departmentId: selectedDepartment } : {}),
                ...(selectedBranch ? { branchId: selectedBranch } : {}),
                ...(selectedStatus ? { status: selectedStatus } : {}),
                ...(selectedTenant && isSuperAdmin ? { tenantId: selectedTenant } : {}),
            });
            const res = await fetch(`/api/admin/employees?${params}`);
            const data = await res.json();
            if (data.success) {
                setEmployees(data.data);
                setTotal(data.meta?.total || 0);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, activeSearch, selectedDepartment, selectedBranch, selectedStatus, selectedTenant, isSuperAdmin]);

    useEffect(() => {
        if (userSession) {
            fetchEmployees();
        }
    }, [fetchEmployees, userSession]);

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setPage(1);
        setActiveSearch(search);
    }

    function clearFilters() {
        setSelectedDepartment("");
        setSelectedBranch("");
        setSelectedStatus("");
        setSelectedTenant("");
        setPage(1);
    }

    const hasActiveFilters = selectedDepartment || selectedBranch || selectedStatus || selectedTenant;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            ACTIVE: "bg-green-100 text-green-700",
            INACTIVE: "bg-yellow-100 text-yellow-700",
            TERMINATED: "bg-red-100 text-red-700",
        };
        return colors[status] || "bg-slate-100";
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Karyawan</h1>
                        <p className="text-slate-600">{total} karyawan terdaftar</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Cari nama atau NIK..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-48 md:w-64"
                            />
                            <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>

                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className={hasActiveFilters ? "border-blue-500 text-blue-600" : ""}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                            {hasActiveFilters && (
                                <span className="ml-1 rounded-full bg-blue-500 px-1.5 text-xs text-white">
                                    {[selectedDepartment, selectedBranch, selectedStatus].filter(Boolean).length}
                                </span>
                            )}
                        </Button>

                        <Button onClick={() => router.push("/admin/employees/new")}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Karyawan
                        </Button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <Card className="mb-6">
                        <CardContent className="py-4">
                            <div className="flex flex-wrap items-end gap-4">
                                {/* Tenant Filter - Only for Super Admin */}
                                {isSuperAdmin && (
                                    <div className="min-w-[200px]">
                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tenant</label>
                                        <div className="relative">
                                            <select
                                                value={selectedTenant}
                                                onChange={(e) => { setSelectedTenant(e.target.value); setPage(1); }}
                                                className="w-full appearance-none rounded-lg border border-purple-300 bg-purple-50 px-3 py-2 pr-8 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                            >
                                                <option value="">Semua Tenant</option>
                                                {tenants.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
                                        </div>
                                    </div>
                                )}

                                <div className="min-w-[180px]">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Department</label>
                                    <div className="relative">
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => { setSelectedDepartment(e.target.value); setPage(1); }}
                                            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="">Semua Department</option>
                                            {departments.map((d) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>

                                <div className="min-w-[180px]">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Cabang</label>
                                    <div className="relative">
                                        <select
                                            value={selectedBranch}
                                            onChange={(e) => { setSelectedBranch(e.target.value); setPage(1); }}
                                            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="">Semua Cabang</option>
                                            {branches.map((b) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>

                                <div className="min-w-[150px]">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                                    <div className="relative">
                                        <select
                                            value={selectedStatus}
                                            onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                                            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="">Semua Status</option>
                                            <option value="ACTIVE">Aktif</option>
                                            <option value="INACTIVE">Nonaktif</option>
                                            <option value="TERMINATED">Terminated</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>

                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="mr-1 h-4 w-4" />
                                        Reset
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Employee List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : employees.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-slate-300" />
                            <p className="mt-4 text-slate-600">Tidak ada karyawan ditemukan</p>
                            {hasActiveFilters && (
                                <Button variant="link" onClick={clearFilters} className="mt-2">
                                    Reset filter
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {employees.map((emp) => (
                                <Card
                                    key={emp.id}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => router.push(`/admin/employees/${emp.id}`)}
                                >
                                    <CardContent className="py-4">
                                        <div className="flex items-start gap-3">
                                            {emp.user?.photoUrl ? (
                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                                                    <Image
                                                        src={emp.user.photoUrl}
                                                        alt={emp.fullName}
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white">
                                                    {emp.fullName.slice(0, 2).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="font-semibold text-slate-900 truncate">{emp.fullName}</h3>
                                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(emp.status)}`}>
                                                        {emp.status === "ACTIVE" ? "Aktif" : emp.status === "INACTIVE" ? "Nonaktif" : emp.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500">#{emp.employeeNumber}</p>

                                                <div className="mt-3 space-y-1 text-sm text-slate-600">
                                                    {/* Show tenant name for Super Admin */}
                                                    {isSuperAdmin && emp.tenant && (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-3 w-3 text-purple-500" />
                                                            <span className="truncate font-medium text-purple-600">{emp.tenant.name}</span>
                                                        </div>
                                                    )}
                                                    {emp.position && (
                                                        <div className="flex items-center gap-2">
                                                            <Briefcase className="h-3 w-3 text-slate-400" />
                                                            <span className="truncate">{emp.position.name}</span>
                                                        </div>
                                                    )}
                                                    {emp.department && (
                                                        <div className="flex items-center gap-2">
                                                            <Building className="h-3 w-3 text-slate-400" />
                                                            <span className="truncate">{emp.department.name}</span>
                                                        </div>
                                                    )}
                                                    {emp.user?.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3 w-3 text-slate-400" />
                                                            <span className="truncate">{emp.user.email}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="rounded bg-slate-100 px-1.5 py-0.5">
                                                        {emp.employmentType === "PERMANENT" ? "Tetap" :
                                                         emp.employmentType === "CONTRACT" ? "Kontrak" :
                                                         emp.employmentType === "INTERNSHIP" ? "Magang" :
                                                         emp.employmentType === "PROBATION" ? "Probation" : emp.employmentType}
                                                    </span>
                                                    <span>•</span>
                                                    <span>Sejak {formatDate(emp.startDate)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {total > 20 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                >
                                    Sebelumnya
                                </Button>
                                <span className="text-sm text-slate-600">
                                    Halaman {page} dari {Math.ceil(total / 20)}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page * 20 >= total}
                                    onClick={() => setPage(page + 1)}
                                >
                                    Selanjutnya
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
