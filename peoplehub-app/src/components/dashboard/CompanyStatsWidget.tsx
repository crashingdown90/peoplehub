// @ai:ag - Company Stats Widget for admin/HRD dashboard

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building, TrendingUp, DollarSign } from "lucide-react";

interface CompanyStats {
    totalEmployees: number;
    activeEmployees: number;
    totalDepartments: number;
    totalBranches: number;
    avgAttendanceRate: number;
    monthlyPayroll: number;
    employeeGrowth: {
        value: number;
        isPositive: boolean;
    };
}

interface CompanyStatsWidgetProps {
    stats: CompanyStats;
}

export function CompanyStatsWidget({ stats }: CompanyStatsWidgetProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatCompact = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Employees */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Total Karyawan</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats.totalEmployees}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {stats.activeEmployees} aktif
                            </p>

                            {/* Growth indicator */}
                            <div className="flex items-center gap-1 mt-2">
                                <svg
                                    className={`h-3 w-3 ${stats.employeeGrowth.isPositive ? "text-green-600" : "text-red-600"
                                        } ${stats.employeeGrowth.isPositive ? "" : "rotate-180"}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span
                                    className={`text-xs font-medium ${stats.employeeGrowth.isPositive ? "text-green-600" : "text-red-600"
                                        }`}
                                >
                                    {Math.abs(stats.employeeGrowth.value)}%
                                </span>
                                <span className="text-xs text-slate-500">bulan ini</span>
                            </div>
                        </div>
                        <div className="rounded-lg p-3 bg-blue-100">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Departments */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Departemen</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats.totalDepartments}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {stats.totalBranches} cabang
                            </p>
                        </div>
                        <div className="rounded-lg p-3 bg-purple-100">
                            <Building className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Attendance Rate */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Tingkat Kehadiran</p>
                            <p className="text-3xl font-bold text-slate-900 mt-2">
                                {stats.avgAttendanceRate}%
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Rata-rata bulan ini</p>
                        </div>
                        <div className="rounded-lg p-3 bg-green-100">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Payroll */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600">Payroll Bulanan</p>
                            <p className="text-2xl font-bold text-slate-900 mt-2">
                                {formatCompact(stats.monthlyPayroll)}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {formatCurrency(stats.monthlyPayroll)}
                            </p>
                        </div>
                        <div className="rounded-lg p-3 bg-amber-100">
                            <DollarSign className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
