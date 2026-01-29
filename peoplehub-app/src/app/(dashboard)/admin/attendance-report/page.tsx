"use client";

// @ai:cl - HRD Attendance Report Page (Daily/Weekly/Monthly)

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Clock, CalendarRange, XCircle, UserCheck,
  Download, Search, Loader2,
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

interface Department {
  id: string;
  code: string;
  name: string;
}

interface DailyEmployee {
  employeeId: string;
  fullName: string;
  employeeNumber: string;
  branch: string;
  department: string;
  position: string;
  shift: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  workMode: string | null;
  lateMinutes: number;
  overtimeMinutes: number;
}

interface DailySummary {
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  attendanceRate: number;
}

interface RangeEmployee {
  employeeId: string;
  fullName: string;
  employeeNumber: string;
  department: string;
  branch: string;
  totalWorkDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  totalLateMinutes: number;
  attendanceRate: number;
}

interface RangeSummary {
  totalEmployees: number;
  totalWorkDays: number;
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalLeave: number;
  avgAttendanceRate: number;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==========================================
// HELPERS
// ==========================================

type Period = "daily" | "weekly" | "monthly";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
  };
}

function getMonthRange(monthStr: string): { start: string; end: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
  PRESENT: { variant: "success", label: "Hadir" },
  LATE: { variant: "warning", label: "Terlambat" },
  ABSENT: { variant: "error", label: "Tidak Hadir" },
  LEAVE: { variant: "info", label: "Cuti" },
  HOLIDAY: { variant: "neutral", label: "Libur" },
};

function rateColor(rate: number): string {
  if (rate >= 90) return "text-green-600";
  if (rate >= 70) return "text-orange-500";
  return "text-red-600";
}

// ==========================================
// COMPONENT
// ==========================================

export default function AttendanceReportPage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(getMonthStr());
  const [departmentId, setDepartmentId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Data
  const [dailyEmployees, setDailyEmployees] = useState<DailyEmployee[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [rangeEmployees, setRangeEmployees] = useState<RangeEmployee[]>([]);
  const [rangeSummary, setRangeSummary] = useState<RangeSummary | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Load departments
  useEffect(() => {
    fetch("/api/admin/departments")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setDepartments(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (period === "daily") {
        const params = new URLSearchParams({
          date: selectedDate,
          page: String(page),
          limit: "50",
        });
        if (departmentId) params.set("departmentId", departmentId);
        if (statusFilter) params.set("status", statusFilter);
        if (search) params.set("search", search);

        const res = await fetch(`/api/attendance/branch?${params}`);
        const json = await res.json();
        if (json.success) {
          setDailyEmployees(json.data.employees);
          setDailySummary(json.data.summary);
          setMeta(json.meta);
        }
      } else {
        const range = period === "weekly"
          ? getWeekRange(selectedDate)
          : getMonthRange(selectedMonth);

        const params = new URLSearchParams({
          startDate: range.start,
          endDate: range.end,
          page: String(page),
          limit: "50",
        });
        if (departmentId) params.set("departmentId", departmentId);
        if (search) params.set("search", search);

        const res = await fetch(`/api/attendance/report?${params}`);
        const json = await res.json();
        if (json.success) {
          setRangeEmployees(json.data.employees);
          setRangeSummary(json.data.summary);
          setMeta(json.meta);
        }
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [period, selectedDate, selectedMonth, departmentId, statusFilter, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [period, selectedDate, selectedMonth, departmentId, statusFilter, search]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleExport = () => {
    let startDate: string, endDate: string;
    if (period === "daily") {
      startDate = endDate = selectedDate;
    } else if (period === "weekly") {
      const range = getWeekRange(selectedDate);
      startDate = range.start;
      endDate = range.end;
    } else {
      const range = getMonthRange(selectedMonth);
      startDate = range.start;
      endDate = range.end;
    }
    window.open(`/api/admin/export/attendance?startDate=${startDate}&endDate=${endDate}`, "_blank");
  };

  // Summary data for cards
  const summaryCards = period === "daily" && dailySummary
    ? [
        { label: "Total Karyawan", value: dailySummary.totalEmployees, icon: Users, color: "text-slate-600", bg: "bg-slate-50" },
        { label: "Hadir", value: dailySummary.present, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
        { label: "Terlambat", value: dailySummary.late, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Tidak Hadir", value: dailySummary.absent, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        { label: "Cuti", value: dailySummary.leave, icon: CalendarRange, color: "text-blue-600", bg: "bg-blue-50" },
      ]
    : rangeSummary
    ? [
        { label: "Total Karyawan", value: rangeSummary.totalEmployees, icon: Users, color: "text-slate-600", bg: "bg-slate-50" },
        { label: "Total Hadir", value: rangeSummary.totalPresent, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
        { label: "Total Terlambat", value: rangeSummary.totalLate, icon: Clock, color: "text-orange-500", bg: "bg-orange-50" },
        { label: "Total Tidak Hadir", value: rangeSummary.totalAbsent, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
        { label: "Total Cuti", value: rangeSummary.totalLeave, icon: CalendarRange, color: "text-blue-600", bg: "bg-blue-50" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laporan Kehadiran</h1>
          <p className="text-sm text-slate-500">Detail absensi karyawan harian, mingguan, atau bulanan</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              period === p
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Date Picker */}
        {period === "monthly" ? (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Bulan</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              {period === "daily" ? "Tanggal" : "Pilih Minggu"}
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {period === "weekly" && (
              <p className="mt-1 text-xs text-slate-400">
                {getWeekRange(selectedDate).start} s/d {getWeekRange(selectedDate).end}
              </p>
            )}
          </div>
        )}

        {/* Department Filter */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Departemen</label>
          <Select value={departmentId} onValueChange={(v) => setDepartmentId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Departemen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Departemen</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter (daily only) */}
        {period === "daily" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="PRESENT">Hadir</SelectItem>
                <SelectItem value="LATE">Terlambat</SelectItem>
                <SelectItem value="ABSENT">Tidak Hadir</SelectItem>
                <SelectItem value="LEAVE">Cuti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Cari Karyawan</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Nama atau NIK..."
              className="w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={handleSearch}
              className="rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50 transition"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${card.bg}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{card.label}</p>
                    <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : period === "daily" ? (
          /* Daily Table */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">NIK</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Departemen</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Shift</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Jam Masuk</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Jam Keluar</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Terlambat</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Mode</th>
                </tr>
              </thead>
              <tbody>
                {dailyEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                      Tidak ada data kehadiran
                    </td>
                  </tr>
                ) : (
                  dailyEmployees.map((emp) => {
                    const st = statusMap[emp.status] || statusMap.ABSENT;
                    return (
                      <tr key={emp.employeeId} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{emp.fullName}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.employeeNumber}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                        <td className="px-4 py-3 text-slate-600">{emp.shift}</td>
                        <td className="px-4 py-3">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatTime(emp.clockIn)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatTime(emp.clockOut)}</td>
                        <td className="px-4 py-3">
                          {emp.lateMinutes > 0 ? (
                            <span className="text-orange-600 font-medium">{emp.lateMinutes} menit</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {emp.workMode ? (
                            <Badge variant={emp.workMode === "WFO" ? "info" : "neutral"}>{emp.workMode}</Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Weekly/Monthly Table */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">NIK</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Departemen</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Hadir</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Terlambat</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Tidak Hadir</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Cuti</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Total Terlambat</th>
                  <th className="px-4 py-3 text-center font-medium text-slate-600">Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {rangeEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                      Tidak ada data kehadiran
                    </td>
                  </tr>
                ) : (
                  rangeEmployees.map((emp) => (
                    <tr key={emp.employeeId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-900">{emp.fullName}</td>
                      <td className="px-4 py-3 text-slate-600">{emp.employeeNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{emp.department}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-green-600 font-medium">{emp.presentDays}</span>
                        <span className="text-slate-400 text-xs"> hari</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={emp.lateDays > 0 ? "text-orange-600 font-medium" : "text-slate-400"}>
                          {emp.lateDays}
                        </span>
                        <span className="text-slate-400 text-xs"> hari</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={emp.absentDays > 0 ? "text-red-600 font-medium" : "text-slate-400"}>
                          {emp.absentDays}
                        </span>
                        <span className="text-slate-400 text-xs"> hari</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={emp.leaveDays > 0 ? "text-blue-600 font-medium" : "text-slate-400"}>
                          {emp.leaveDays}
                        </span>
                        <span className="text-slate-400 text-xs"> hari</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {emp.totalLateMinutes > 0 ? (
                          <span className="text-orange-600 font-medium">{emp.totalLateMinutes} menit</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${rateColor(emp.attendanceRate)}`}>
                          {emp.attendanceRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-sm text-slate-500">
              Menampilkan {(meta.page - 1) * meta.limit + 1}-{Math.min(meta.page * meta.limit, meta.total)} dari {meta.total} karyawan
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
