"use client";

// @ai:cx - Attendance Settings page for HRD

import { useEffect, useState, useCallback } from "react";
import { fetchWithCsrf } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Clock,
    Timer,
    MapPin,
    ScanFace,
    CalendarDays,
    Save,
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    AlertTriangle,
    RefreshCcw,
    Building2,
    Ban,
    RotateCcw,
} from "lucide-react";

interface AttendanceSettings {
    id: string;
    defaultShiftStart: string;
    defaultShiftEnd: string;
    breakMinutes: number;
    earliestClockIn: string;
    latestClockOut: string;
    gracePeriodMinutes: number;
    lateDeductionEnabled: boolean;
    lateDeductionType: string;
    lateDeductionAmount: number;
    geofenceRadius: number;
    geofenceEnabled: boolean;
    requireFaceDetection: boolean;
    requireLiveness: boolean;
    minFaceConfidence: number;
    workDays: number[];
}

interface Branch {
    id: string;
    name: string;
    code: string;
}

interface LateRule {
    id: string;
    tenantId: string;
    branchId: string | null;
    minLateMinutes: number;
    maxLateMinutes: number;
    deductionAmount: number;
    deductionType: string;
    isActive: boolean;
    createdAt: string;
    branch?: Branch | null;
}

interface LateRuleFormData {
    branchId: string;
    minLateMinutes: number;
    maxLateMinutes: number;
    deductionAmount: number;
    deductionType: string;
    isActive: boolean;
}

const defaultSettings: AttendanceSettings = {
    id: "",
    defaultShiftStart: "08:00",
    defaultShiftEnd: "17:00",
    breakMinutes: 60,
    earliestClockIn: "06:00",
    latestClockOut: "22:00",
    gracePeriodMinutes: 5,
    lateDeductionEnabled: false,
    lateDeductionType: "PER_MINUTE",
    lateDeductionAmount: 0,
    geofenceRadius: 100,
    geofenceEnabled: true,
    requireFaceDetection: true,
    requireLiveness: true,
    minFaceConfidence: 0.7,
    workDays: [1, 2, 3, 4, 5],
};

const initialLateRuleFormData: LateRuleFormData = {
    branchId: "",
    minLateMinutes: 1,
    maxLateMinutes: 15,
    deductionAmount: 25000,
    deductionType: "FIXED",
    isActive: true,
};

const dayLabels: Record<number, string> = {
    1: "Senin",
    2: "Selasa",
    3: "Rabu",
    4: "Kamis",
    5: "Jumat",
    6: "Sabtu",
    7: "Minggu",
};

export default function AttendanceSettingsPage() {
    const [settings, setSettings] = useState<AttendanceSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [rules, setRules] = useState<LateRule[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [rulesLoading, setRulesLoading] = useState(true);
    const [filterBranch, setFilterBranch] = useState("");
    const [filterActive, setFilterActive] = useState<string>("");
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
    const [ruleFormData, setRuleFormData] = useState<LateRuleFormData>(initialLateRuleFormData);
    const [ruleSubmitting, setRuleSubmitting] = useState(false);
    const [ruleError, setRuleError] = useState<string | null>(null);
    const [ruleSuccessMessage, setRuleSuccessMessage] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetchWithCsrf("/api/admin/settings/attendance");
            const data = await res.json();
            if (data.success) {
                setSettings(data.data);
            }
        } catch {
            setMessage({ type: "error", text: "Gagal memuat pengaturan" });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRules = useCallback(async () => {
        try {
            setRulesLoading(true);
            const params = new URLSearchParams();
            if (filterBranch) params.set("branchId", filterBranch);
            if (filterActive) params.set("isActive", filterActive);
            const res = await fetchWithCsrf(`/api/admin/late-rules?${params}`);
            const data = await res.json();
            if (data.success) {
                setRules(data.data || []);
            } else {
                setRuleError(data.error?.message || "Gagal memuat data");
            }
        } catch {
            setRuleError("Gagal memuat data aturan keterlambatan");
        } finally {
            setRulesLoading(false);
        }
    }, [filterBranch, filterActive]);

    const fetchBranches = useCallback(async () => {
        try {
            const res = await fetchWithCsrf("/api/admin/branches");
            const data = await res.json();
            if (data.success) {
                setBranches(data.data || []);
            }
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        fetchRules();
        fetchBranches();
    }, [fetchRules, fetchBranches]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        if (ruleSuccessMessage) {
            const timer = setTimeout(() => setRuleSuccessMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [ruleSuccessMessage]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const { id, ...payload } = settings;
            void id;
            const res = await fetchWithCsrf("/api/admin/settings/attendance", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                setSettings(data.data);
                setMessage({ type: "success", text: data.message || "Pengaturan berhasil disimpan" });
            } else {
                setMessage({ type: "error", text: data.error?.message || "Gagal menyimpan pengaturan" });
            }
        } catch {
            setMessage({ type: "error", text: "Gagal menyimpan pengaturan" });
        } finally {
            setSaving(false);
        }
    };

    const handleRuleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRuleSubmitting(true);
        setRuleError(null);

        if (ruleFormData.minLateMinutes >= ruleFormData.maxLateMinutes) {
            setRuleError("Menit minimum harus lebih kecil dari menit maksimum");
            setRuleSubmitting(false);
            return;
        }

        try {
            const url = editingRuleId
                ? `/api/admin/late-rules/${editingRuleId}`
                : "/api/admin/late-rules";
            const method = editingRuleId ? "PATCH" : "POST";

            const res = await fetchWithCsrf(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...ruleFormData,
                    branchId: ruleFormData.branchId || null,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setRuleSuccessMessage(data.message || "Berhasil disimpan");
                setShowRuleForm(false);
                setEditingRuleId(null);
                setRuleFormData(initialLateRuleFormData);
                fetchRules();
            } else {
                setRuleError(data.error?.message || "Gagal menyimpan");
            }
        } catch {
            setRuleError("Gagal menyimpan aturan keterlambatan");
        } finally {
            setRuleSubmitting(false);
        }
    };

    const handleEditRule = (rule: LateRule) => {
        setRuleFormData({
            branchId: rule.branchId || "",
            minLateMinutes: rule.minLateMinutes,
            maxLateMinutes: rule.maxLateMinutes,
            deductionAmount: Number(rule.deductionAmount),
            deductionType: rule.deductionType,
            isActive: rule.isActive,
        });
        setEditingRuleId(rule.id);
        setShowRuleForm(true);
        setRuleError(null);
    };

    const handleDeleteRule = async (id: string) => {
        try {
            setRuleSubmitting(true);
            const res = await fetchWithCsrf(`/api/admin/late-rules/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (data.success) {
                setRuleSuccessMessage(data.message || "Aturan berhasil dihapus");
                setDeleteConfirm(null);
                fetchRules();
            } else {
                setRuleError(data.error?.message || "Gagal menghapus");
            }
        } catch {
            setRuleError("Gagal menghapus aturan");
        } finally {
            setRuleSubmitting(false);
        }
    };

    const handleToggleRuleActive = async (rule: LateRule) => {
        try {
            setRuleSubmitting(true);
            const res = await fetchWithCsrf(`/api/admin/late-rules/${rule.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !rule.isActive }),
            });
            const data = await res.json();

            if (data.success) {
                setRuleSuccessMessage(rule.isActive ? "Aturan dinonaktifkan" : "Aturan diaktifkan");
                fetchRules();
            } else {
                setRuleError(data.error?.message || "Gagal mengubah status");
            }
        } catch {
            setRuleError("Gagal mengubah status aturan");
        } finally {
            setRuleSubmitting(false);
        }
    };

    const cancelRuleForm = () => {
        setShowRuleForm(false);
        setEditingRuleId(null);
        setRuleFormData(initialLateRuleFormData);
        setRuleError(null);
    };

    const toggleWorkDay = (day: number) => {
        setSettings((prev) => ({
            ...prev,
            workDays: prev.workDays.includes(day)
                ? prev.workDays.filter((d) => d !== day)
                : [...prev.workDays, day].sort(),
        }));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-accent)]" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">Pengaturan Kehadiran</h1>
                    <p className="mt-1 text-sm text-[var(--color-text-subtle)]">
                        Atur jam kerja default, geofence, biometrik, dan hari kerja
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div
                    className={`rounded-lg px-4 py-3 text-sm font-medium ${
                        message.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                    {message.text}
                </div>
            )}

            {/* Section 1: Jam Kerja */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[var(--color-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Jam Kerja Default</h2>
                </div>
                <p className="mb-4 text-sm text-[var(--color-text-subtle)]">
                    Jam kerja yang berlaku jika karyawan tidak memiliki shift khusus
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Jam Masuk</label>
                        <input
                            type="time"
                            value={settings.defaultShiftStart}
                            onChange={(e) => setSettings({ ...settings, defaultShiftStart: e.target.value })}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Jam Pulang</label>
                        <input
                            type="time"
                            value={settings.defaultShiftEnd}
                            onChange={(e) => setSettings({ ...settings, defaultShiftEnd: e.target.value })}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Istirahat (menit)</label>
                        <input
                            type="number"
                            min={0}
                            max={180}
                            value={settings.breakMinutes}
                            onChange={(e) => setSettings({ ...settings, breakMinutes: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Window Clock In/Out */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex items-center gap-2">
                    <Timer className="h-5 w-5 text-[var(--color-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Window Clock In/Out</h2>
                </div>
                <p className="mb-4 text-sm text-[var(--color-text-subtle)]">
                    Batas waktu clock-in paling awal dan clock-out paling akhir, serta toleransi keterlambatan
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Clock-in Paling Awal</label>
                        <input
                            type="time"
                            value={settings.earliestClockIn}
                            onChange={(e) => setSettings({ ...settings, earliestClockIn: e.target.value })}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Clock-out Paling Akhir</label>
                        <input
                            type="time"
                            value={settings.latestClockOut}
                            onChange={(e) => setSettings({ ...settings, latestClockOut: e.target.value })}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Grace Period (menit)</label>
                        <input
                            type="number"
                            min={0}
                            max={60}
                            value={settings.gracePeriodMinutes}
                            onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: parseInt(e.target.value) || 0 })}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                        />
                        <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Toleransi sebelum dianggap terlambat</p>
                    </div>
                </div>
            </div>

            {/* Section 3: Aturan Keterlambatan Bertingkat */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">Aturan Keterlambatan Bertingkat</h2>
                        <p className="text-sm text-[var(--color-text-subtle)]">
                            Kelola aturan potongan berdasarkan rentang waktu keterlambatan
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setShowRuleForm(true);
                            setEditingRuleId(null);
                            setRuleFormData(initialLateRuleFormData);
                            setRuleError(null);
                        }}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Tambah Aturan
                    </Button>
                </div>

                {ruleSuccessMessage && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 border border-green-200">
                        <Check className="h-5 w-5" />
                        {ruleSuccessMessage}
                    </div>
                )}

                {ruleError && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
                        <AlertTriangle className="h-5 w-5" />
                        {ruleError}
                        <button onClick={() => setRuleError(null)} className="ml-auto">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {showRuleForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <Card className="w-full max-w-2xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Clock className="h-5 w-5" />
                                    {editingRuleId ? "Edit Aturan Keterlambatan" : "Tambah Aturan Keterlambatan Baru"}
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={cancelRuleForm}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleRuleSubmit} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Cabang (Opsional)
                                            </label>
                                            <select
                                                value={ruleFormData.branchId}
                                                onChange={(e) => setRuleFormData({ ...ruleFormData, branchId: e.target.value })}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="">Semua Cabang (Default)</option>
                                                {branches.map((branch) => (
                                                    <option key={branch.id} value={branch.id}>
                                                        {branch.name} ({branch.code})
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-slate-500">Kosongkan untuk berlaku di semua cabang</p>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Jenis Potongan
                                            </label>
                                            <select
                                                value={ruleFormData.deductionType}
                                                onChange={(e) => setRuleFormData({ ...ruleFormData, deductionType: e.target.value })}
                                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            >
                                                <option value="FIXED">Nominal Tetap (Rp)</option>
                                                <option value="PERCENTAGE">Persentase (%)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Terlambat Min (menit) <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={ruleFormData.minLateMinutes}
                                                onChange={(e) => setRuleFormData({ ...ruleFormData, minLateMinutes: parseInt(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Terlambat Max (menit) <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={ruleFormData.maxLateMinutes}
                                                onChange={(e) => setRuleFormData({ ...ruleFormData, maxLateMinutes: parseInt(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                {ruleFormData.deductionType === "FIXED" ? "Nominal Potongan (Rp)" : "Persentase (%)"}{" "}
                                                <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={ruleFormData.deductionType === "PERCENTAGE" ? "0.1" : "1000"}
                                                value={ruleFormData.deductionAmount}
                                                onChange={(e) => setRuleFormData({ ...ruleFormData, deductionAmount: parseFloat(e.target.value) || 0 })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {editingRuleId && (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={ruleFormData.isActive}
                                                onChange={(e) => setRuleFormData({ ...ruleFormData, isActive: e.target.checked })}
                                                className="h-4 w-4 rounded border-slate-300"
                                            />
                                            <label htmlFor="isActive" className="text-sm text-slate-700">
                                                Aturan Aktif
                                            </label>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={cancelRuleForm} disabled={ruleSubmitting}>
                                            Batal
                                        </Button>
                                        <Button type="submit" disabled={ruleSubmitting}>
                                            {ruleSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="mr-2 h-4 w-4" />
                                                    {editingRuleId ? "Update" : "Simpan"}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card className="mb-4">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap gap-3">
                                <select
                                    value={filterBranch}
                                    onChange={(e) => setFilterBranch(e.target.value)}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Semua Cabang</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={filterActive}
                                    onChange={(e) => setFilterActive(e.target.value)}
                                    className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="true">Aktif</option>
                                    <option value="false">Non-Aktif</option>
                                </select>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchRules} disabled={rulesLoading}>
                                <RefreshCcw className={`h-4 w-4 ${rulesLoading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Clock className="h-5 w-5" />
                            Daftar Aturan Potongan Keterlambatan ({rules.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rulesLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                            </div>
                        ) : rules.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <Clock className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                                <p>Belum ada aturan keterlambatan</p>
                                <p className="text-sm">Klik &quot;Tambah Aturan&quot; untuk menambahkan</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-slate-500">
                                            <th className="pb-3 pr-4 font-medium">Rentang Waktu</th>
                                            <th className="pb-3 pr-4 font-medium">Potongan</th>
                                            <th className="pb-3 pr-4 font-medium">Cabang</th>
                                            <th className="pb-3 pr-4 font-medium text-center">Status</th>
                                            <th className="pb-3 font-medium text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rules.map((rule) => (
                                            <tr key={rule.id} className={`border-b last:border-0 ${!rule.isActive ? "bg-slate-50 opacity-60" : ""}`}>
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-slate-400" />
                                                        <span className="font-medium">
                                                            {rule.minLateMinutes} - {rule.maxLateMinutes} menit
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    {rule.deductionType === "FIXED" ? (
                                                        <span className="font-medium text-red-600">
                                                            {formatCurrency(Number(rule.deductionAmount))}
                                                        </span>
                                                    ) : (
                                                        <span className="font-medium text-red-600">
                                                            {rule.deductionAmount}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4 text-sm text-slate-600">
                                                    {rule.branch ? (
                                                        <span className="inline-flex items-center gap-1">
                                                            <Building2 className="h-3 w-3" />
                                                            {rule.branch.name}
                                                        </span>
                                                    ) : (
                                                        "Semua Cabang"
                                                    )}
                                                </td>
                                                <td className="py-3 pr-4 text-center">
                                                    {rule.isActive ? (
                                                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                            Aktif
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                                            Non-Aktif
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEditRule(rule)}
                                                            title="Edit"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleToggleRuleActive(rule)}
                                                            disabled={ruleSubmitting}
                                                            className={rule.isActive ? "text-yellow-600 hover:bg-yellow-50" : "text-green-600 hover:bg-green-50"}
                                                            title={rule.isActive ? "Nonaktifkan" : "Aktifkan"}
                                                        >
                                                            {rule.isActive ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                                                        </Button>
                                                        {deleteConfirm === rule.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleDeleteRule(rule.id)}
                                                                    disabled={ruleSubmitting}
                                                                    className="text-red-600 hover:bg-red-50"
                                                                    title="Konfirmasi hapus"
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    title="Batal"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setDeleteConfirm(rule.id)}
                                                                className="text-red-600 hover:bg-red-50"
                                                                title="Hapus"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="mt-4 bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium mb-1">Cara Kerja Aturan Keterlambatan:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-700">
                                    <li>Aturan akan diterapkan berdasarkan rentang waktu keterlambatan</li>
                                    <li>Aturan cabang akan di-prioritaskan daripada aturan tenant-wide</li>
                                    <li>Jika tidak ada aturan yang cocok, tidak ada potongan yang diterapkan</li>
                                    <li>Potongan tetap (FIXED) dalam Rupiah, persentase dari gaji pokok harian</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Section 4: Geofence */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[var(--color-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Geofence</h2>
                </div>
                <p className="mb-4 text-sm text-[var(--color-text-subtle)]">
                    Validasi lokasi saat clock-in/out untuk mode WFO
                </p>
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={settings.geofenceEnabled}
                            onChange={(e) => setSettings({ ...settings, geofenceEnabled: e.target.checked })}
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
                        />
                        <span className="text-sm font-medium text-[var(--color-text)]">Aktifkan validasi geofence</span>
                    </label>
                    {settings.geofenceEnabled && (
                        <div className="max-w-xs">
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">Radius Default (meter)</label>
                            <input
                                type="number"
                                min={10}
                                max={10000}
                                value={settings.geofenceRadius}
                                onChange={(e) => setSettings({ ...settings, geofenceRadius: parseInt(e.target.value) || 100 })}
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                            />
                            <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Bisa di-override per cabang</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 5: Biometrik */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex items-center gap-2">
                    <ScanFace className="h-5 w-5 text-[var(--color-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Biometrik</h2>
                </div>
                <p className="mb-4 text-sm text-[var(--color-text-subtle)]">
                    Verifikasi wajah dan deteksi liveness saat clock-in/out
                </p>
                <div className="space-y-4">
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={settings.requireFaceDetection}
                            onChange={(e) => setSettings({ ...settings, requireFaceDetection: e.target.checked })}
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
                        />
                        <span className="text-sm font-medium text-[var(--color-text)]">Wajib deteksi wajah</span>
                    </label>
                    <label className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={settings.requireLiveness}
                            onChange={(e) => setSettings({ ...settings, requireLiveness: e.target.checked })}
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)]"
                        />
                        <span className="text-sm font-medium text-[var(--color-text)]">Wajib liveness detection</span>
                    </label>
                    {settings.requireFaceDetection && (
                        <div className="max-w-xs">
                            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                                Minimum Face Confidence ({(settings.minFaceConfidence * 100).toFixed(0)}%)
                            </label>
                            <input
                                type="range"
                                min={0.1}
                                max={1}
                                step={0.05}
                                value={settings.minFaceConfidence}
                                onChange={(e) => setSettings({ ...settings, minFaceConfidence: parseFloat(e.target.value) })}
                                className="w-full accent-[var(--color-accent)]"
                            />
                            <div className="flex justify-between text-xs text-[var(--color-text-subtle)]">
                                <span>10%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 6: Hari Kerja */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-[var(--color-accent)]" />
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">Hari Kerja</h2>
                </div>
                <p className="mb-4 text-sm text-[var(--color-text-subtle)]">
                    Pilih hari kerja default untuk perhitungan kehadiran
                </p>
                <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                        const active = settings.workDays.includes(day);
                        return (
                            <button
                                key={day}
                                type="button"
                                onClick={() => toggleWorkDay(day)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                                    active
                                        ? "bg-[var(--color-accent)] text-white"
                                        : "bg-[var(--color-bg)] text-[var(--color-text-subtle)] border border-[var(--color-border)] hover:bg-[var(--color-border)]"
                                }`}
                            >
                                {dayLabels[day]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Simpan Pengaturan
                </button>
            </div>
        </div>
    );
}
