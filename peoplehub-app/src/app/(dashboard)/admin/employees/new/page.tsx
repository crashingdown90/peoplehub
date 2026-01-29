"use client";

// @ai:cx - New Employee Form

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, ChevronDown, UserPlus } from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

const createEmployeeSchema = z.object({
    userId: z.string().min(1, "User wajib dipilih"),
    fullName: z.string().min(2, "Nama minimal 2 karakter"),
    employeeNumber: z.string().min(1, "NIK karyawan wajib diisi"),
    nik: z.string().optional(),
    npwp: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    branchId: z.string().optional(),
    departmentId: z.string().optional(),
    positionId: z.string().optional(),
    managerId: z.string().optional(),
    employmentType: z.enum(["PERMANENT", "CONTRACT", "INTERNSHIP", "PROBATION"]),
    workMode: z.enum(["WFO", "WFH", "HYBRID"]),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankAccountHolder: z.string().optional(),
});

type FormData = z.infer<typeof createEmployeeSchema>;

interface SelectOption {
    id: string;
    name?: string;
    fullName?: string;
    email?: string;
}

export default function NewEmployeePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Options for select fields
    const [users, setUsers] = useState<SelectOption[]>([]);
    const [branches, setBranches] = useState<SelectOption[]>([]);
    const [departments, setDepartments] = useState<SelectOption[]>([]);
    const [positions, setPositions] = useState<SelectOption[]>([]);
    const [employees, setEmployees] = useState<SelectOption[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(createEmployeeSchema),
        defaultValues: {
            employmentType: "PERMANENT",
            workMode: "WFO",
            startDate: new Date().toISOString().split("T")[0],
        },
    });

    const selectedUserId = watch("userId");

    // Fetch options
    useEffect(() => {
        async function fetchOptions() {
            try {
                const [usersRes, branchesRes, deptsRes, posRes, empsRes] = await Promise.all([
                    fetchWithCsrf("/api/admin/users?status=APPROVED&hasNoEmployee=true"),
                    fetchWithCsrf("/api/admin/branches"),
                    fetchWithCsrf("/api/admin/departments"),
                    fetchWithCsrf("/api/admin/positions"),
                    fetchWithCsrf("/api/admin/employees?status=ACTIVE&limit=100"),
                ]);

                const [usersData, branchesData, deptsData, posData, empsData] = await Promise.all([
                    usersRes.json(),
                    branchesRes.json(),
                    deptsRes.json(),
                    posRes.json(),
                    empsRes.json(),
                ]);

                if (usersData.success) setUsers(usersData.data);
                if (branchesData.success) setBranches(branchesData.data);
                if (deptsData.success) setDepartments(deptsData.data);
                if (posData.success) setPositions(posData.data);
                if (empsData.success) setEmployees(empsData.data);
            } catch (err) {
                console.error("Error fetching options:", err);
            }
        }
        fetchOptions();
    }, []);

    // Auto-fill name when user is selected
    useEffect(() => {
        if (selectedUserId) {
            const selectedUser = users.find((u) => u.id === selectedUserId);
            if (selectedUser?.fullName) {
                setValue("fullName", selectedUser.fullName);
            }
        }
    }, [selectedUserId, users, setValue]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetchWithCsrf("/api/admin/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error?.message || "Gagal menambahkan karyawan");
                return;
            }

            router.push("/admin/employees");
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-3xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                                <UserPlus className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Tambah Karyawan Baru</CardTitle>
                                <CardDescription>Lengkapi data karyawan di bawah ini</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-6">
                            {error && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                    {error}
                                </div>
                            )}

                            {/* User Selection */}
                            <div className="rounded-lg border border-slate-200 p-4 space-y-4">
                                <h3 className="font-medium text-slate-900">Akun User</h3>
                                <div>
                                    <Label htmlFor="userId">Pilih User *</Label>
                                    <div className="relative mt-1.5">
                                        <select
                                            id="userId"
                                            {...register("userId")}
                                            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="">-- Pilih User --</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.fullName || u.email} ({u.email})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                    {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>}
                                    <p className="mt-1 text-xs text-slate-500">Hanya user yang belum memiliki data karyawan yang ditampilkan</p>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="rounded-lg border border-slate-200 p-4 space-y-4">
                                <h3 className="font-medium text-slate-900">Data Pribadi</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="fullName">Nama Lengkap *</Label>
                                        <Input id="fullName" {...register("fullName")} className="mt-1.5" />
                                        {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="employeeNumber">NIK Karyawan *</Label>
                                        <Input id="employeeNumber" {...register("employeeNumber")} className="mt-1.5" placeholder="EMP001" />
                                        {errors.employeeNumber && <p className="mt-1 text-sm text-red-600">{errors.employeeNumber.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="nik">NIK (KTP)</Label>
                                        <Input id="nik" {...register("nik")} className="mt-1.5" placeholder="16 digit" />
                                    </div>
                                    <div>
                                        <Label htmlFor="npwp">NPWP</Label>
                                        <Input id="npwp" {...register("npwp")} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">No. Telepon</Label>
                                        <Input id="phone" {...register("phone")} className="mt-1.5" placeholder="08xxx" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="address">Alamat</Label>
                                        <textarea
                                            id="address"
                                            {...register("address")}
                                            rows={2}
                                            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Employment Info */}
                            <div className="rounded-lg border border-slate-200 p-4 space-y-4">
                                <h3 className="font-medium text-slate-900">Data Kepegawaian</h3>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="branchId">Cabang</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="branchId"
                                                {...register("branchId")}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="">-- Pilih Cabang --</option>
                                                {branches.map((b) => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="departmentId">Department</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="departmentId"
                                                {...register("departmentId")}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="">-- Pilih Department --</option>
                                                {departments.map((d) => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="positionId">Jabatan</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="positionId"
                                                {...register("positionId")}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="">-- Pilih Jabatan --</option>
                                                {positions.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="managerId">Atasan Langsung</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="managerId"
                                                {...register("managerId")}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="">-- Tidak Ada --</option>
                                                {employees.map((e) => (
                                                    <option key={e.id} value={e.id}>{e.fullName}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="employmentType">Tipe Karyawan *</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="employmentType"
                                                {...register("employmentType")}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="PERMANENT">Tetap</option>
                                                <option value="CONTRACT">Kontrak</option>
                                                <option value="INTERNSHIP">Magang</option>
                                                <option value="PROBATION">Probation</option>
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="workMode">Mode Kerja *</Label>
                                        <div className="relative mt-1.5">
                                            <select
                                                id="workMode"
                                                {...register("workMode")}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="WFO">WFO (Work From Office)</option>
                                                <option value="WFH">WFH (Work From Home)</option>
                                                <option value="HYBRID">Hybrid</option>
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="startDate">Tanggal Mulai Kerja *</Label>
                                        <Input id="startDate" type="date" {...register("startDate")} className="mt-1.5" />
                                        {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Bank Info */}
                            <div className="rounded-lg border border-slate-200 p-4 space-y-4">
                                <h3 className="font-medium text-slate-900">Data Bank</h3>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <Label htmlFor="bankName">Nama Bank</Label>
                                        <Input id="bankName" {...register("bankName")} className="mt-1.5" placeholder="BCA, Mandiri, dll" />
                                    </div>
                                    <div>
                                        <Label htmlFor="bankAccountNumber">No. Rekening</Label>
                                        <Input id="bankAccountNumber" {...register("bankAccountNumber")} className="mt-1.5" />
                                    </div>
                                    <div>
                                        <Label htmlFor="bankAccountHolder">Nama Pemilik Rekening</Label>
                                        <Input id="bankAccountHolder" {...register("bankAccountHolder")} className="mt-1.5" />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        "Simpan Karyawan"
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    );
}
