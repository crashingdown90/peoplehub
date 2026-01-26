"use client";

// @ai:cx - Create new announcement page

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Save, Send, Pin } from "lucide-react";
import { useCsrf } from "@/hooks/useCsrf";

interface SelectOption {
    id: string;
    name: string;
}

const ROLES = [
    { id: "EMPLOYEE", name: "Employee" },
    { id: "MANAGER", name: "Manager" },
    { id: "HRD", name: "HRD" },
    { id: "FINANCE", name: "Finance" },
];

export default function NewAnnouncementPage() {
    const router = useRouter();
    const { getHeaders } = useCsrf();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form data
    const [form, setForm] = useState({
        title: "",
        content: "",
        priority: "NORMAL",
        isPinned: false,
        expiresAt: "",
        targetBranches: [] as string[],
        targetDepartments: [] as string[],
        targetRoles: [] as string[],
    });

    // Options
    const [branches, setBranches] = useState<SelectOption[]>([]);
    const [departments, setDepartments] = useState<SelectOption[]>([]);

    useEffect(() => {
        const fetchOptions = async () => {
            setLoading(true);
            try {
                const [branchRes, deptRes] = await Promise.all([
                    fetch("/api/admin/branches"),
                    fetch("/api/admin/departments"),
                ]);

                const [branchData, deptData] = await Promise.all([
                    branchRes.json(),
                    deptRes.json(),
                ]);

                if (branchData.success) setBranches(branchData.data);
                if (deptData.success) setDepartments(deptData.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, []);

    const handleCheckboxChange = (
        field: "targetBranches" | "targetDepartments" | "targetRoles",
        value: string
    ) => {
        setForm((prev) => {
            const current = prev[field];
            const updated = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const handleSubmit = async (publishNow: boolean) => {
        if (!form.title.trim() || !form.content.trim()) {
            setError("Judul dan konten wajib diisi");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const targetAudience =
                form.targetBranches.length > 0 ||
                    form.targetDepartments.length > 0 ||
                    form.targetRoles.length > 0
                    ? {
                        branches: form.targetBranches.length > 0 ? form.targetBranches : undefined,
                        departments: form.targetDepartments.length > 0 ? form.targetDepartments : undefined,
                        roles: form.targetRoles.length > 0 ? form.targetRoles : undefined,
                    }
                    : undefined;

            const res = await fetch("/api/announcements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getHeaders(),
                },
                body: JSON.stringify({
                    title: form.title,
                    content: form.content,
                    priority: form.priority,
                    isPinned: form.isPinned,
                    expiresAt: form.expiresAt || undefined,
                    targetAudience,
                    publishNow,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error?.message || "Gagal membuat pengumuman");
                return;
            }

            router.push("/admin/announcements");
        } catch (err) {
            console.error(err);
            setError("Terjadi kesalahan");
        } finally {
            setSubmitting(false);
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
                        <CardTitle>Buat Pengumuman Baru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Judul <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="Judul pengumuman"
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Konten <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows={6}
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder="Isi pengumuman..."
                                />
                            </div>

                            {/* Priority & Pin */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Prioritas
                                    </label>
                                    <select
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="NORMAL">Normal</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Tanggal Kadaluarsa
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={form.expiresAt}
                                        onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Pin */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isPinned"
                                    checked={form.isPinned}
                                    onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300"
                                />
                                <label htmlFor="isPinned" className="flex items-center gap-2 text-sm text-slate-700">
                                    <Pin className="h-4 w-4" />
                                    Pin pengumuman ini (tampil di atas)
                                </label>
                            </div>

                            {/* Target Audience */}
                            <div className="border-t pt-4">
                                <h3 className="mb-3 font-medium text-slate-900">
                                    Target Penerima
                                </h3>
                                <p className="mb-4 text-sm text-slate-500">
                                    Kosongkan semua untuk mengirim ke semua karyawan
                                </p>

                                {/* Branches */}
                                {branches.length > 0 && (
                                    <div className="mb-4">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Cabang
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {branches.map((branch) => (
                                                <label
                                                    key={branch.id}
                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${form.targetBranches.includes(branch.id)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={form.targetBranches.includes(branch.id)}
                                                        onChange={() => handleCheckboxChange("targetBranches", branch.id)}
                                                        className="hidden"
                                                    />
                                                    {branch.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Departments */}
                                {departments.length > 0 && (
                                    <div className="mb-4">
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Departemen
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {departments.map((dept) => (
                                                <label
                                                    key={dept.id}
                                                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${form.targetDepartments.includes(dept.id)
                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                        : "border-slate-200 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={form.targetDepartments.includes(dept.id)}
                                                        onChange={() => handleCheckboxChange("targetDepartments", dept.id)}
                                                        className="hidden"
                                                    />
                                                    {dept.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Roles */}
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Role
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ROLES.map((role) => (
                                            <label
                                                key={role.id}
                                                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${form.targetRoles.includes(role.id)
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-slate-200 hover:bg-slate-50"
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={form.targetRoles.includes(role.id)}
                                                    onChange={() => handleCheckboxChange("targetRoles", role.id)}
                                                    className="hidden"
                                                />
                                                {role.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-3 border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleSubmit(false)}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    Simpan Draft
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleSubmit(true)}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Publish Sekarang
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
