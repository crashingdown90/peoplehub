"use client";

// @ai:cx - Holiday Settings Page

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  AlertTriangle,
  RefreshCcw,
  Globe,
  Building2,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface Holiday {
  id: string;
  name: string;
  holidayDate: string;
  branchId: string | null;
  isNational: boolean;
  branch: Branch | null;
  createdAt: string;
}

interface FormData {
  name: string;
  holidayDate: string;
  branchId: string;
  isNational: boolean;
}

const initialFormData: FormData = {
  name: "",
  holidayDate: "",
  branchId: "",
  isNational: true,
};

export default function HolidaysSettingsPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [filterBranch, setFilterBranch] = useState("");
  const [filterNational, setFilterNational] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("year", selectedYear);
      if (filterBranch) params.set("branchId", filterBranch);
      if (filterNational) params.set("isNational", filterNational);

      const res = await fetch(`/api/admin/settings/holidays?${params}`);
      const data = await res.json();

      if (data.success) {
        setHolidays(data.data.holidays);
        setBranches(data.data.branches);
      } else {
        setError(data.error?.message || "Gagal memuat data");
      }
    } catch (err) {
      setError("Gagal memuat data hari libur");
    } finally {
      setLoading(false);
    }
  }, [selectedYear, filterBranch, filterNational]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

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
        ? `/api/admin/settings/holidays/${editingId}`
        : "/api/admin/settings/holidays";
      const method = editingId ? "PUT" : "POST";

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
        fetchHolidays();
      } else {
        setError(data.error?.message || "Gagal menyimpan");
      }
    } catch (err) {
      setError("Gagal menyimpan hari libur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (holiday: Holiday) => {
    setFormData({
      name: holiday.name,
      holidayDate: holiday.holidayDate.split("T")[0],
      branchId: holiday.branchId || "",
      isNational: holiday.isNational,
    });
    setEditingId(holiday.id);
    setShowForm(true);
    setError(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/settings/holidays/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(data.message || "Hari libur berhasil dihapus");
        setDeleteConfirm(null);
        fetchHolidays();
      } else {
        setError(data.error?.message || "Gagal menghapus");
      }
    } catch (err) {
      setError("Gagal menghapus hari libur");
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pengaturan Hari Libur</h1>
            <p className="text-slate-600">Kelola hari libur nasional dan cuti bersama</p>
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
            Tambah Hari Libur
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
                <Calendar className="h-5 w-5" />
                {editingId ? "Edit Hari Libur" : "Tambah Hari Libur Baru"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Nama Hari Libur <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Hari Kemerdekaan RI"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Tanggal <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.holidayDate}
                      onChange={(e) => setFormData({ ...formData, holidayDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

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
                      <option value="">Semua Cabang</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} ({branch.code})
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">Kosongkan untuk berlaku di semua cabang</p>
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="isNational"
                      checked={formData.isNational}
                      onChange={(e) => setFormData({ ...formData, isNational: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <label htmlFor="isNational" className="text-sm text-slate-700">
                      Hari Libur Nasional
                    </label>
                  </div>
                </div>

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
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      Tahun {year}
                    </option>
                  ))}
                </select>
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
                  value={filterNational}
                  onChange={(e) => setFilterNational(e.target.value)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Semua Jenis</option>
                  <option value="true">Nasional</option>
                  <option value="false">Non-Nasional</option>
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={fetchHolidays} disabled={loading}>
                <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Holidays List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Daftar Hari Libur Tahun {selectedYear} ({holidays.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : holidays.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p>Belum ada hari libur untuk tahun {selectedYear}</p>
                <p className="text-sm">Klik &quot;Tambah Hari Libur&quot; untuk menambahkan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-slate-500">
                      <th className="pb-3 pr-4 font-medium">Tanggal</th>
                      <th className="pb-3 pr-4 font-medium">Nama</th>
                      <th className="pb-3 pr-4 font-medium text-center">Jenis</th>
                      <th className="pb-3 pr-4 font-medium">Cabang</th>
                      <th className="pb-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((holiday) => (
                      <tr key={holiday.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-medium">{formatDate(holiday.holidayDate)}</p>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-medium text-slate-900">{holiday.name}</td>
                        <td className="py-3 pr-4 text-center">
                          {holiday.isNational ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                              <Globe className="h-3 w-3" />
                              Nasional
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              <Building2 className="h-3 w-3" />
                              Lokal
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-sm text-slate-600">
                          {holiday.branch ? `${holiday.branch.name}` : "Semua Cabang"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(holiday)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {deleteConfirm === holiday.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(holiday.id)}
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
                                onClick={() => setDeleteConfirm(holiday.id)}
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
                <p className="font-medium mb-1">Catatan:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Hari libur nasional berlaku untuk semua karyawan</li>
                  <li>Hari libur lokal hanya berlaku untuk cabang tertentu</li>
                  <li>Sistem akan otomatis tidak menghitung keterlambatan pada hari libur</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
