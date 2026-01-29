"use client";

// @ai:cx - Leave Types Settings Page

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarRange,
  Plus,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  Loader2,
  Check,
  X,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { fetchWithCsrf } from "@/lib/api-client";

interface LeaveType {
  id: string;
  code: string;
  name: string;
  defaultBalance: number;
  isPaid: boolean;
  requiresAttachment: boolean;
  isActive: boolean;
  createdAt: string;
  usageCount?: number;
}

interface FormData {
  code: string;
  name: string;
  defaultBalance: number;
  isPaid: boolean;
  requiresAttachment: boolean;
  isActive: boolean;
}

const initialFormData: FormData = {
  code: "",
  name: "",
  defaultBalance: 12,
  isPaid: true,
  requiresAttachment: false,
  isActive: true,
};

export default function LeaveTypesSettingsPage() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (includeInactive) params.set("includeInactive", "true");
      if (search) params.set("search", search);

      const res = await fetchWithCsrf(`/api/admin/settings/leave-types?${params}`);
      const data = await res.json();

      if (data.success) {
        setLeaveTypes(data.data);
      } else {
        setError(data.error?.message || "Gagal memuat data");
      }
    } catch (err) {
      setError("Gagal memuat data jenis cuti");
    } finally {
      setLoading(false);
    }
  }, [includeInactive, search]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

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

    try {
      const url = editingId
        ? `/api/admin/settings/leave-types/${editingId}`
        : "/api/admin/settings/leave-types";
      const method = editingId ? "PUT" : "POST";

      const res = await fetchWithCsrf(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || "Berhasil disimpan");
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        fetchLeaveTypes();
      } else {
        setError(data.error?.message || "Gagal menyimpan");
      }
    } catch (err) {
      setError("Gagal menyimpan jenis cuti");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (leaveType: LeaveType) => {
    setFormData({
      code: leaveType.code,
      name: leaveType.name,
      defaultBalance: leaveType.defaultBalance,
      isPaid: leaveType.isPaid,
      requiresAttachment: leaveType.requiresAttachment,
      isActive: leaveType.isActive,
    });
    setEditingId(leaveType.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await fetchWithCsrf(`/api/admin/settings/leave-types/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || "Jenis cuti berhasil dinonaktifkan");
        setDeleteConfirm(null);
        fetchLeaveTypes();
      } else {
        setError(data.error?.message || "Gagal menonaktifkan");
      }
    } catch (err) {
      setError("Gagal menonaktifkan jenis cuti");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await fetchWithCsrf(`/api/admin/settings/leave-types/${id}`, {
        method: "PATCH",
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || "Jenis cuti berhasil diaktifkan");
        fetchLeaveTypes();
      } else {
        setError(data.error?.message || "Gagal mengaktifkan");
      }
    } catch (err) {
      setError("Gagal mengaktifkan jenis cuti");
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengaturan Jenis Cuti</h1>
            <p className="text-slate-600">Kelola jenis cuti yang tersedia untuk karyawan</p>
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
            Tambah Jenis Cuti
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <Card className="w-full max-w-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarRange className="h-5 w-5" />
                  {editingId ? "Edit Jenis Cuti" : "Tambah Jenis Cuti Baru"}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={cancelForm}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Kode <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="Contoh: ANNUAL, SICK, MATERNITY"
                        required
                        className="uppercase"
                      />
                      <p className="mt-1 text-xs text-slate-500">Kode unik (huruf kapital, angka, underscore)</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Nama <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Contoh: Cuti Tahunan"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Jatah Default (hari) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={365}
                        value={formData.defaultBalance}
                        onChange={(e) => setFormData({ ...formData, defaultBalance: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="isPaid"
                        checked={formData.isPaid}
                        onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <label htmlFor="isPaid" className="text-sm text-slate-700">
                        Cuti Berbayar
                      </label>
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <input
                        type="checkbox"
                        id="requiresAttachment"
                        checked={formData.requiresAttachment}
                        onChange={(e) => setFormData({ ...formData, requiresAttachment: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <label htmlFor="requiresAttachment" className="text-sm text-slate-700">
                        Wajib Lampiran
                      </label>
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
                        Aktif
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
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Cari kode atau nama..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={includeInactive}
                    onChange={(e) => setIncludeInactive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Tampilkan non-aktif
                </label>
                <Button variant="outline" size="sm" onClick={fetchLeaveTypes} disabled={loading}>
                  <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Types Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarRange className="h-5 w-5" />
              Daftar Jenis Cuti ({leaveTypes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : leaveTypes.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <CalendarRange className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p>Belum ada jenis cuti</p>
                <p className="text-sm">Klik &quot;Tambah Jenis Cuti&quot; untuk menambahkan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-slate-500">
                      <th className="pb-3 pr-4 font-medium">Kode</th>
                      <th className="pb-3 pr-4 font-medium">Nama</th>
                      <th className="pb-3 pr-4 font-medium text-center">Jatah</th>
                      <th className="pb-3 pr-4 font-medium text-center">Berbayar</th>
                      <th className="pb-3 pr-4 font-medium text-center">Lampiran</th>
                      <th className="pb-3 pr-4 font-medium text-center">Status</th>
                      <th className="pb-3 pr-4 font-medium text-center">Digunakan</th>
                      <th className="pb-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveTypes.map((lt) => (
                      <tr key={lt.id} className={`border-b last:border-0 ${!lt.isActive ? "bg-slate-50 opacity-60" : ""}`}>
                        <td className="py-3 pr-4">
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">{lt.code}</code>
                        </td>
                        <td className="py-3 pr-4 font-medium text-slate-900">{lt.name}</td>
                        <td className="py-3 pr-4 text-center">{lt.defaultBalance} hari</td>
                        <td className="py-3 pr-4 text-center">
                          {lt.isPaid ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <Check className="mr-1 h-3 w-3" />
                              Ya
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                              <X className="mr-1 h-3 w-3" />
                              Tidak
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {lt.requiresAttachment ? (
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                              Wajib
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {lt.isActive ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                              Non-aktif
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-center text-sm text-slate-600">
                          {lt.usageCount || 0}x
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(lt)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {lt.isActive ? (
                              deleteConfirm === lt.id ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(lt.id)}
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
                                  onClick={() => setDeleteConfirm(lt.id)}
                                  className="text-red-600 hover:bg-red-50"
                                  title="Nonaktifkan"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReactivate(lt.id)}
                                disabled={submitting}
                                className="text-green-600 hover:bg-green-50"
                                title="Aktifkan kembali"
                              >
                                <RotateCcw className="h-4 w-4" />
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
                <p className="font-medium mb-1">Catatan Penting:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Jenis cuti yang sudah digunakan tidak dapat dihapus permanen, hanya dinonaktifkan</li>
                  <li>Jenis cuti non-aktif tidak akan muncul di pilihan saat karyawan mengajukan cuti</li>
                  <li>Jatah default akan diterapkan pada saldo cuti karyawan baru</li>
                  <li>Perubahan jatah default tidak otomatis mempengaruhi saldo karyawan yang sudah ada</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
