"use client";

// @ai:cx - Employee edit page for HRD and Super Admin

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useCsrf } from "@/hooks/useCsrf";

interface EmployeeData {
    id: string;
    employeeNumber: string;
    fullName: string;
    nik: string;
    npwp: string;
    phone: string;
    address: string;
    employmentType: string;
    workMode: string;
    status: string;
    branchId?: string;
    departmentId?: string;
    positionId?: string;
    managerId?: string | null;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    branch?: { id: string; name: string };
    department?: { id: string; name: string };
    position?: { id: string; name: string };
    manager?: { id: string; fullName: string };
}

interface SelectOption {
    id: string;
    name: string;
    code?: string;
}

interface EmployeeOption {
    id: string;
    fullName: string;
    employeeNumber: string;
}

export default function EmployeeEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { getHeaders } = useCsrf();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        fullName: "",
        nik: "",
        npwp: "",
        phone: "",
        address: "",
        employmentType: "PERMANENT",
        workMode: "WFO",
        status: "ACTIVE",
        branchId: "",
        departmentId: "",
        positionId: "",
        managerId: "",
        bankName: "",
        bankAccountNumber: "",
        bankAccountHolder: "",
    });

    // Dropdown options
    const [branches, setBranches] = useState<SelectOption[]>([]);
    const [departments, setDepartments] = useState<SelectOption[]>([]);
    const [positions, setPositions] = useState<SelectOption[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);

    // Fetch employee data and dropdown options
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all data in parallel
                const [empRes, branchRes, deptRes, posRes, empListRes] = await Promise.all([
                    fetch(`/api/admin/employees/${id}`),
                    fetch("/api/admin/branches"),
                    fetch("/api/admin/departments"),
                    fetch("/api/admin/positions"),
                    fetch("/api/admin/employees?limit=100"),
                ]);

                const [empData, branchData, deptData, posData, empListData] = await Promise.all([
                    empRes.json(),
                    branchRes.json(),
                    deptRes.json(),
                    posRes.json(),
                    empListRes.json(),
                ]);

                if (empData.success) {
                    const emp: EmployeeData = empData.data;
                    setFormData({
                        fullName: emp.fullName || "",
                        nik: emp.nik || "",
                        npwp: emp.npwp || "",
                        phone: emp.phone || "",
                        address: emp.address || "",
                        employmentType: emp.employmentType || "PERMANENT",
                        workMode: emp.workMode || "WFO",
                        status: emp.status || "ACTIVE",
                        branchId: emp.branch?.id || "",
                        departmentId: emp.department?.id || "",
                        positionId: emp.position?.id || "",
                        managerId: emp.manager?.id || "",
                        bankName: emp.bankName || "",
                        bankAccountNumber: emp.bankAccountNumber || "",
                        bankAccountHolder: emp.bankAccountHolder || "",
                    });
                }

                if (branchData.success) setBranches(branchData.data);
                if (deptData.success) setDepartments(deptData.data);
                if (posData.success) setPositions(posData.data);
                if (empListData.success) {
                    // Filter out current employee from manager list
                    setEmployees(empListData.data.filter((e: EmployeeOption) => e.id !== id));
                }
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Gagal memuat data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch(`/api/admin/employees/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders(),
                },
                body: JSON.stringify({
                    ...formData,
                    managerId: formData.managerId || null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error?.message || "Gagal menyimpan data");
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push(`/admin/employees/${id}`);
            }, 1500);
        } catch (err) {
            console.error("Error saving:", err);
            setError("Terjadi kesalahan saat menyimpan");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-3xl">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Edit Data Karyawan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
                                Data berhasil disimpan! Mengalihkan...
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div>
                                <h3 className="mb-4 font-medium text-slate-900">Informasi Pribadi</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">
                                            Nama Lengkap <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            required
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">NIK</label>
                                        <input
                                            type="text"
                                            name="nik"
                                            value={formData.nik}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">NPWP</label>
                                        <input
                                            type="text"
                                            name="npwp"
                                            value={formData.npwp}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">No. Telepon</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Alamat</label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            rows={2}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Employment Information */}
                            <div>
                                <h3 className="mb-4 font-medium text-slate-900">Informasi Pekerjaan</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="ACTIVE">Active</option>
                                            <option value="INACTIVE">Inactive</option>
                                            <option value="TERMINATED">Terminated</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Tipe Karyawan</label>
                                        <select
                                            name="employmentType"
                                            value={formData.employmentType}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="PERMANENT">Permanent</option>
                                            <option value="CONTRACT">Contract</option>
                                            <option value="INTERNSHIP">Internship</option>
                                            <option value="PROBATION">Probation</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Mode Kerja</label>
                                        <select
                                            name="workMode"
                                            value={formData.workMode}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="WFO">WFO (Work From Office)</option>
                                            <option value="WFH">WFH (Work From Home)</option>
                                            <option value="HYBRID">Hybrid</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Cabang</label>
                                        <select
                                            name="branchId"
                                            value={formData.branchId}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih Cabang</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Departemen</label>
                                        <select
                                            name="departmentId"
                                            value={formData.departmentId}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih Departemen</option>
                                            {departments.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Posisi</label>
                                        <select
                                            name="positionId"
                                            value={formData.positionId}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih Posisi</option>
                                            {positions.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Atasan Langsung</label>
                                        <select
                                            name="managerId"
                                            value={formData.managerId}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Tidak Ada</option>
                                            {employees.map(e => (
                                                <option key={e.id} value={e.id}>
                                                    {e.fullName} ({e.employeeNumber})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Bank Information */}
                            <div>
                                <h3 className="mb-4 font-medium text-slate-900">Informasi Bank</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Nama Bank</label>
                                        <input
                                            type="text"
                                            name="bankName"
                                            value={formData.bankName}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">No. Rekening</label>
                                        <input
                                            type="text"
                                            name="bankAccountNumber"
                                            value={formData.bankAccountNumber}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-sm font-medium text-slate-700">Nama Pemilik Rekening</label>
                                        <input
                                            type="text"
                                            name="bankAccountHolder"
                                            value={formData.bankAccountHolder}
                                            onChange={handleChange}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Batal
                                </Button>
                                <Button type="submit" disabled={saving}>
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
