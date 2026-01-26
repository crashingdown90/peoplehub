"use client";

// @ai:cx - Late Rules Settings Page

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  AlertTriangle,
  RefreshCcw,
  Building2,
  Ban,
  RotateCcw,
} from "lucide-react";

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

interface FormData {
  branchId: string;
  minLateMinutes: number;
  maxLateMinutes: number;
  deductionAmount: number;
  deductionType: string;
  isActive: boolean;
}

const initialFormData: FormData = {
  branchId: "",
  minLateMinutes: 1,
  maxLateMinutes: 15,
  deductionAmount: 25000,
  deductionType: "FIXED",
  isActive: true,
};

export default function LateRulesSettingsPage() {
  const [rules, setRules] = useState<LateRule[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBranch, setFilterBranch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterBranch) params.set("branchId", filterBranch);
      if (filterActive) params.set("isActive", filterActive);

      const res = await fetch(`/api/admin/late-rules?${params}`);
      const data = await res.json();

      if (data.success) {
        setRules(data.data || []);
      } else {
        setError(data.error?.message || "Gagal memuat data");
      }
    } catch (err) {
      setError("Gagal memuat data aturan keterlambatan");
    } finally {
      setLoading(false);
    }
  }, [filterBranch, filterActive]);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/branches");
      const data = await res.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchBranches();
  }, [fetchRules, fetchBranches]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validation
    if (formData.minLateMinutes >= formData.maxLateMinutes) {
      setError("Menit minimum harus lebih kecil dari menit maksimum");
      setSubmitting(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/late-rules/${editingId}`
        : "/api/admin/late-rules";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          branchId: formData.branchId || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || "Berhasil disimpan");
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        fetchRules();
      } else {
        setError(data.error?.message || "Gagal menyimpan");
      }
    } catch (err) {
      setError("Gagal menyimpan aturan keterlambatan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (rule: LateRule) => {
    setFormData({
      branchId: rule.branchId || "",
      minLateMinutes: rule.minLateMinutes,
      maxLateMinutes: rule.maxLateMinutes,
      deductionAmount: Number(rule.deductionAmount),
      deductionType: rule.deductionType,
      isActive: rule.isActive,
    });
    setEditingId(rule.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/late-rules/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || "Aturan berhasil dihapus");
        setDeleteConfirm(null);
        fetchRules();
      } else {
        setError(data.error?.message || "Gagal menghapus");
      }
    } catch (err) {
      setError("Gagal menghapus aturan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (rule: LateRule) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/late-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(rule.isActive ? "Aturan dinonaktifkan" : "Aturan diaktifkan");
        fetchRules();
      } else {
        setError(data.error?.message || "Gagal mengubah status");
      }
    } catch (err) {
      setError("Gagal mengubah status aturan");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
    setError(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengaturan Toleransi Keterlambatan</h1>
            <p className="text-slate-600">Kelola aturan potongan berdasarkan keterlambatan</p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData(initialFormData);
              setError(null);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Aturan
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-700 border border-green-200">
            <Check className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
            <AlertTriangle className="h-5 w-5" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                {editingId ? "Edit Aturan Keterlambatan" : "Tambah Aturan Keterlambatan Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Cabang (Opsional)
                    </label>
                    <select
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
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
                      value={formData.deductionType}
                      onChange={(e) => setFormData({ ...formData, deductionType: e.target.value })}
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
                      value={formData.minLateMinutes}
                      onChange={(e) => setFormData({ ...formData, minLateMinutes: parseInt(e.target.value) || 0 })}
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
                      value={formData.maxLateMinutes}
                      onChange={(e) => setFormData({ ...formData, maxLateMinutes: parseInt(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {formData.deductionType === "FIXED" ? "Nominal Potongan (Rp)" : "Persentase (%)"} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={formData.deductionType === "PERCENTAGE" ? "0.1" : "1000"}
                      value={formData.deductionAmount}
                      onChange={(e) => setFormData({ ...formData, deductionAmount: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                {editingId && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <label htmlFor="isActive" className="text-sm text-slate-700">
                      Aturan Aktif
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={cancelForm} disabled={submitting}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {editingId ? "Update" : "Simpan"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
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
              <Button variant="outline" size="sm" onClick={fetchRules} disabled={loading}>
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rules List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Daftar Aturan Potongan Keterlambatan ({rules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
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
                              onClick={() => handleEdit(rule)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(rule)}
                              disabled={submitting}
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
                                  onClick={() => handleDelete(rule.id)}
                                  disabled={submitting}
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

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
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
    </div>
  );
}
