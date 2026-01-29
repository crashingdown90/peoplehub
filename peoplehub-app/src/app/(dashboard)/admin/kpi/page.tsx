"use client";

// @ai:cx - Admin KPI Management Page

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Target, Calendar, BarChart3, Users, Plus, Loader2,
    Pencil, Trash2, X, Check, ChevronDown
} from "lucide-react";
import { useCsrf } from "@/hooks/useCsrf";

// Types
interface KpiPeriod {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    _count?: { kpiTargets: number };
}

interface KpiIndicator {
    id: string;
    code: string;
    name: string;
    description: string | null;
    unit: string;
    targetType: string;
    weight: number;
    isActive: boolean;
    _count?: { kpiTargets: number };
}

interface Employee {
    id: string;
    fullName: string;
    employeeNumber: string;
    department?: { name: string };
    position?: { name: string };
}

interface KpiTarget {
    id: string;
    targetValue: number;
    actualValue: number | null;
    score: number | null;
    notes: string | null;
    employee: { id: string; fullName: string; employeeNumber: string };
    indicator: { id: string; name: string; unit: string };
    period: { id: string; name: string };
}

type TabType = "periods" | "indicators" | "targets";

export default function AdminKpiPage() {
    const { getHeaders } = useCsrf();
    const [activeTab, setActiveTab] = useState<TabType>("periods");
    const [loading, setLoading] = useState(true);

    // Data states
    const [periods, setPeriods] = useState<KpiPeriod[]>([]);
    const [indicators, setIndicators] = useState<KpiIndicator[]>([]);
    const [targets, setTargets] = useState<KpiTarget[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);

    // Modal states
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [showIndicatorModal, setShowIndicatorModal] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [showScoreModal, setShowScoreModal] = useState(false);

    // Edit states
    const [editingPeriod, setEditingPeriod] = useState<KpiPeriod | null>(null);
    const [editingIndicator, setEditingIndicator] = useState<KpiIndicator | null>(null);
    const [editingTarget, setEditingTarget] = useState<KpiTarget | null>(null);

    // Filter states
    const [selectedPeriodFilter, setSelectedPeriodFilter] = useState("");
    const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState("");

    // Form states
    const [periodForm, setPeriodForm] = useState({ name: "", startDate: "", endDate: "", isActive: true });
    const [indicatorForm, setIndicatorForm] = useState({
        code: "", name: "", description: "", unit: "", targetType: "HIGHER_BETTER", weight: 1
    });
    const [targetForm, setTargetForm] = useState({
        employeeId: "", periodId: "", indicatorId: "", targetValue: ""
    });
    const [scoreForm, setScoreForm] = useState({ actualValue: "", notes: "" });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, [activeTab, selectedPeriodFilter, selectedEmployeeFilter]);

    async function fetchData() {
        setLoading(true);
        try {
            if (activeTab === "periods") {
                const res = await fetch("/api/kpi/periods");
                const data = await res.json();
                if (data.success) setPeriods(data.data);
            } else if (activeTab === "indicators") {
                const res = await fetch("/api/kpi/indicators");
                const data = await res.json();
                if (data.success) setIndicators(data.data);
            } else if (activeTab === "targets") {
                const params = new URLSearchParams();
                if (selectedPeriodFilter) params.set("periodId", selectedPeriodFilter);
                if (selectedEmployeeFilter) params.set("employeeId", selectedEmployeeFilter);

                const [targetRes, periodRes, empRes] = await Promise.all([
                    fetch(`/api/kpi/targets?mode=admin&${params}`),
                    fetch("/api/kpi/periods"),
                    fetch("/api/admin/employees?limit=100"),
                ]);
                const [targetData, periodData, empData] = await Promise.all([
                    targetRes.json(),
                    periodRes.json(),
                    empRes.json(),
                ]);
                if (targetData.success) setTargets(targetData.data);
                if (periodData.success) setPeriods(periodData.data);
                if (empData.success) setEmployees(empData.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    // Period functions
    async function savePeriod() {
        setSaving(true);
        setError(null);
        try {
            const url = editingPeriod ? `/api/kpi/periods/${editingPeriod.id}` : "/api/kpi/periods";
            const method = editingPeriod ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", ...getHeaders() },
                body: JSON.stringify(periodForm),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error?.message || "Gagal menyimpan periode");
                return;
            }
            setShowPeriodModal(false);
            setEditingPeriod(null);
            setPeriodForm({ name: "", startDate: "", endDate: "", isActive: true });
            fetchData();
        } catch (err) {
            setError("Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    }

    async function deletePeriod(id: string) {
        if (!confirm("Yakin hapus periode ini?")) return;
        try {
            const res = await fetch(`/api/kpi/periods/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    }


    // Indicator functions
    async function saveIndicator() {
        setSaving(true);
        setError(null);
        try {
            const url = editingIndicator ? `/api/kpi/indicators/${editingIndicator.id}` : "/api/kpi/indicators";
            const method = editingIndicator ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", ...getHeaders() },
                body: JSON.stringify({
                    ...indicatorForm,
                    weight: Number(indicatorForm.weight),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error?.message || "Gagal menyimpan indikator");
                return;
            }
            setShowIndicatorModal(false);
            setEditingIndicator(null);
            setIndicatorForm({ code: "", name: "", description: "", unit: "", targetType: "HIGHER_BETTER", weight: 1 });
            fetchData();
        } catch (err) {
            setError("Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    }

    async function deleteIndicator(id: string) {
        if (!confirm("Yakin hapus indikator ini?")) return;
        try {
            const res = await fetch(`/api/kpi/indicators/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    // Target functions
    async function saveTarget() {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/kpi/targets", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...getHeaders() },
                body: JSON.stringify({
                    ...targetForm,
                    targetValue: Number(targetForm.targetValue),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error?.message || "Gagal menyimpan target");
                return;
            }
            setShowTargetModal(false);
            setTargetForm({ employeeId: "", periodId: "", indicatorId: "", targetValue: "" });
            fetchData();
        } catch (err) {
            setError("Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    }

    async function saveScore() {
        if (!editingTarget) return;
        setSaving(true);
        setError(null);
        try {
            const payload: Record<string, number | string | null> = {
                actualValue: scoreForm.actualValue ? Number(scoreForm.actualValue) : null,
            };
            if (scoreForm.notes && scoreForm.notes.trim().length > 0) {
                payload.notes = scoreForm.notes.trim();
            }
            const res = await fetch(`/api/kpi/targets/${editingTarget.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...getHeaders() },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error?.message || "Gagal menyimpan nilai");
                return;
            }
            setShowScoreModal(false);
            setEditingTarget(null);
            setScoreForm({ actualValue: "", notes: "" });
            fetchData();
        } catch (err) {
            setError("Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    }

    async function deleteTarget(id: string) {
        if (!confirm("Yakin hapus target ini?")) return;
        try {
            const res = await fetch(`/api/kpi/targets/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    }

    const getScoreColor = (score: number | null) => {
        if (score === null) return "text-slate-400";
        if (score >= 90) return "text-green-600";
        if (score >= 70) return "text-blue-600";
        if (score >= 50) return "text-yellow-600";
        return "text-red-600";
    };

    const tabs = [
        { id: "periods" as TabType, label: "Periode", icon: Calendar },
        { id: "indicators" as TabType, label: "Indikator", icon: BarChart3 },
        { id: "targets" as TabType, label: "Target Karyawan", icon: Users },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Kelola KPI</h1>
                    <p className="text-slate-600">Atur periode, indikator, dan target KPI karyawan</p>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 border-b border-slate-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    activeTab === tab.id
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        {/* Periods Tab */}
                        {activeTab === "periods" && (
                            <div>
                                <div className="mb-4 flex justify-end gap-2">
                                    <Button onClick={() => {
                                        setEditingPeriod(null);
                                        setPeriodForm({ name: "", startDate: "", endDate: "", isActive: true });
                                        setShowPeriodModal(true);
                                    }}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Periode
                                    </Button>
                                </div>

                                {periods.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                                            <p className="mt-4 text-slate-600">Belum ada periode KPI</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {periods.map((period) => (
                                            <Card key={period.id}>
                                                <CardContent className="py-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900">{period.name}</h3>
                                                            <p className="text-sm text-slate-500">
                                                                {new Date(period.startDate).toLocaleDateString("id-ID")} -{" "}
                                                                {new Date(period.endDate).toLocaleDateString("id-ID")}
                                                            </p>
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                                    period.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                                }`}>
                                                                    {period.isActive ? "Aktif" : "Nonaktif"}
                                                                </span>
                                                                {period._count && (
                                                                    <span className="text-xs text-slate-500">
                                                                        {period._count.kpiTargets} target
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setEditingPeriod(period);
                                                                    setPeriodForm({
                                                                        name: period.name,
                                                                        startDate: period.startDate.split("T")[0],
                                                                        endDate: period.endDate.split("T")[0],
                                                                        isActive: period.isActive,
                                                                    });
                                                                    setShowPeriodModal(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() => deletePeriod(period.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Indicators Tab */}
                        {activeTab === "indicators" && (
                            <div>
                                <div className="mb-4 flex justify-end">
                                    <Button onClick={() => {
                                        setEditingIndicator(null);
                                        setIndicatorForm({ code: "", name: "", description: "", unit: "", targetType: "HIGHER_BETTER", weight: 1 });
                                        setShowIndicatorModal(true);
                                    }}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Tambah Indikator
                                    </Button>
                                </div>

                                {indicators.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
                                            <p className="mt-4 text-slate-600">Belum ada indikator KPI</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="space-y-3">
                                        {indicators.map((ind) => (
                                            <Card key={ind.id}>
                                                <CardContent className="py-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                                    {ind.code}
                                                                </span>
                                                                <h3 className="font-semibold text-slate-900">{ind.name}</h3>
                                                            </div>
                                                            {ind.description && (
                                                                <p className="mt-1 text-sm text-slate-500">{ind.description}</p>
                                                            )}
                                                            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                                                                <span>Unit: <strong>{ind.unit}</strong></span>
                                                                <span>Bobot: <strong>{ind.weight}</strong></span>
                                                                <span>
                                                                    Tipe: <strong>{ind.targetType === "HIGHER_BETTER" ? "Makin Tinggi Makin Baik" : "Makin Rendah Makin Baik"}</strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setEditingIndicator(ind);
                                                                    setIndicatorForm({
                                                                        code: ind.code,
                                                                        name: ind.name,
                                                                        description: ind.description || "",
                                                                        unit: ind.unit,
                                                                        targetType: ind.targetType,
                                                                        weight: ind.weight,
                                                                    });
                                                                    setShowIndicatorModal(true);
                                                                }}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-600 hover:text-red-700"
                                                                onClick={() => deleteIndicator(ind.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Targets Tab */}
                        {activeTab === "targets" && (
                            <div>
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex flex-wrap gap-3">
                                        <div className="relative min-w-[180px]">
                                            <select
                                                value={selectedPeriodFilter}
                                                onChange={(e) => setSelectedPeriodFilter(e.target.value)}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm"
                                            >
                                                <option value="">Semua Periode</option>
                                                {periods.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                        <div className="relative min-w-[200px]">
                                            <select
                                                value={selectedEmployeeFilter}
                                                onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
                                                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm"
                                            >
                                                <option value="">Semua Karyawan</option>
                                                {employees.map((e) => (
                                                    <option key={e.id} value={e.id}>{e.fullName}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                    <Button onClick={() => {
                                        setTargetForm({ employeeId: "", periodId: "", indicatorId: "", targetValue: "" });
                                        setShowTargetModal(true);
                                    }}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Assign Target
                                    </Button>
                                </div>

                                {targets.length === 0 ? (
                                    <Card>
                                        <CardContent className="py-12 text-center">
                                            <Target className="mx-auto h-12 w-12 text-slate-300" />
                                            <p className="mt-4 text-slate-600">Belum ada target KPI</p>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-200 text-left text-sm text-slate-600">
                                                    <th className="pb-3 font-medium">Karyawan</th>
                                                    <th className="pb-3 font-medium">Periode</th>
                                                    <th className="pb-3 font-medium">Indikator</th>
                                                    <th className="pb-3 font-medium text-right">Target</th>
                                                    <th className="pb-3 font-medium text-right">Aktual</th>
                                                    <th className="pb-3 font-medium text-right">Skor</th>
                                                    <th className="pb-3 font-medium text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {targets.map((target) => (
                                                    <tr key={target.id} className="border-b border-slate-100">
                                                        <td className="py-3">
                                                            <div>
                                                                <p className="font-medium text-slate-900">{target.employee.fullName}</p>
                                                                <p className="text-xs text-slate-500">#{target.employee.employeeNumber}</p>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-sm text-slate-600">{target.period.name}</td>
                                                        <td className="py-3 text-sm text-slate-600">{target.indicator.name}</td>
                                                        <td className="py-3 text-right text-sm">
                                                            {target.targetValue} {target.indicator.unit}
                                                        </td>
                                                        <td className="py-3 text-right text-sm">
                                                            {target.actualValue !== null ? `${target.actualValue} ${target.indicator.unit}` : "-"}
                                                        </td>
                                                        <td className={`py-3 text-right text-sm font-bold ${getScoreColor(target.score)}`}>
                                                            {target.score !== null ? `${Number(target.score).toFixed(1)}%` : "-"}
                                                        </td>
                                                        <td className="py-3 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingTarget(target);
                                                                        setScoreForm({
                                                                            actualValue: target.actualValue?.toString() || "",
                                                                            notes: target.notes || "",
                                                                        });
                                                                        setShowScoreModal(true);
                                                                    }}
                                                                >
                                                                    Input Nilai
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-red-600"
                                                                    onClick={() => deleteTarget(target.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Period Modal */}
                {showPeriodModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">{editingPeriod ? "Edit Periode" : "Tambah Periode"}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowPeriodModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Nama Periode</label>
                                    <Input
                                        value={periodForm.name}
                                        onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                                        placeholder="Q1 2026"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Tanggal Mulai</label>
                                        <Input
                                            type="date"
                                            value={periodForm.startDate}
                                            onChange={(e) => setPeriodForm({ ...periodForm, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Tanggal Selesai</label>
                                        <Input
                                            type="date"
                                            value={periodForm.endDate}
                                            onChange={(e) => setPeriodForm({ ...periodForm, endDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={periodForm.isActive}
                                        onChange={(e) => setPeriodForm({ ...periodForm, isActive: e.target.checked })}
                                        className="h-4 w-4 rounded border-slate-300"
                                    />
                                    <span className="text-sm">Periode Aktif</span>
                                </label>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowPeriodModal(false)}>Batal</Button>
                                <Button onClick={savePeriod} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Indicator Modal */}
                {showIndicatorModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">{editingIndicator ? "Edit Indikator" : "Tambah Indikator"}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowIndicatorModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Kode</label>
                                        <Input
                                            value={indicatorForm.code}
                                            onChange={(e) => setIndicatorForm({ ...indicatorForm, code: e.target.value.toUpperCase() })}
                                            placeholder="SALES01"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Unit</label>
                                        <Input
                                            value={indicatorForm.unit}
                                            onChange={(e) => setIndicatorForm({ ...indicatorForm, unit: e.target.value })}
                                            placeholder="%"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Nama Indikator</label>
                                    <Input
                                        value={indicatorForm.name}
                                        onChange={(e) => setIndicatorForm({ ...indicatorForm, name: e.target.value })}
                                        placeholder="Target Penjualan"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Deskripsi (Opsional)</label>
                                    <Input
                                        value={indicatorForm.description}
                                        onChange={(e) => setIndicatorForm({ ...indicatorForm, description: e.target.value })}
                                        placeholder="Pencapaian target penjualan bulanan"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Tipe Target</label>
                                        <select
                                            value={indicatorForm.targetType}
                                            onChange={(e) => setIndicatorForm({ ...indicatorForm, targetType: e.target.value })}
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        >
                                            <option value="HIGHER_BETTER">Makin Tinggi Makin Baik</option>
                                            <option value="LOWER_BETTER">Makin Rendah Makin Baik</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Bobot</label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={indicatorForm.weight}
                                            onChange={(e) => setIndicatorForm({ ...indicatorForm, weight: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowIndicatorModal(false)}>Batal</Button>
                                <Button onClick={saveIndicator} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Target Modal */}
                {showTargetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Assign Target KPI</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowTargetModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Karyawan</label>
                                    <select
                                        value={targetForm.employeeId}
                                        onChange={(e) => setTargetForm({ ...targetForm, employeeId: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="">Pilih Karyawan</option>
                                        {employees.map((e) => (
                                            <option key={e.id} value={e.id}>{e.fullName} ({e.employeeNumber})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Periode</label>
                                    <select
                                        value={targetForm.periodId}
                                        onChange={(e) => setTargetForm({ ...targetForm, periodId: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="">Pilih Periode</option>
                                        {periods.filter(p => p.isActive).map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Indikator</label>
                                    <select
                                        value={targetForm.indicatorId}
                                        onChange={(e) => setTargetForm({ ...targetForm, indicatorId: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                    >
                                        <option value="">Pilih Indikator</option>
                                        {indicators.filter(i => i.isActive).map((i) => (
                                            <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Target Value</label>
                                    <Input
                                        type="number"
                                        value={targetForm.targetValue}
                                        onChange={(e) => setTargetForm({ ...targetForm, targetValue: e.target.value })}
                                        placeholder="100"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowTargetModal(false)}>Batal</Button>
                                <Button onClick={saveTarget} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Score Modal */}
                {showScoreModal && editingTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Input Nilai Aktual</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowScoreModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                            <div className="mb-4 rounded-lg bg-slate-50 p-3">
                                <p className="text-sm text-slate-600">
                                    <strong>{editingTarget.employee.fullName}</strong> - {editingTarget.indicator.name}
                                </p>
                                <p className="text-sm text-slate-500">
                                    Target: {editingTarget.targetValue} {editingTarget.indicator.unit}
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Nilai Aktual</label>
                                    <Input
                                        type="number"
                                        value={scoreForm.actualValue}
                                        onChange={(e) => setScoreForm({ ...scoreForm, actualValue: e.target.value })}
                                        placeholder="Masukkan nilai aktual"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Catatan (Opsional)</label>
                                    <textarea
                                        value={scoreForm.notes}
                                        onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                        placeholder="Catatan penilaian..."
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowScoreModal(false)}>Batal</Button>
                                <Button onClick={saveScore} disabled={saving}>
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                    Simpan
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
