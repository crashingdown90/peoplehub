// @ai:ag - Performance Chart component for employee metrics

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface PerformanceData {
    month: string;
    attendance: number; // percentage 0-100
    productivity: number; // percentage 0-100
    rating: number; // 0-5
}

interface PerformanceChartProps {
    data: PerformanceData[];
    title?: string;
}

export function PerformanceChart({
    data,
    title = "Kinerja 6 Bulan Terakhir",
}: PerformanceChartProps) {
    const maxValue = 100;
    const chartHeight = 200;

    // Calculate averages
    const avgAttendance =
        data.length > 0
            ? Math.round(data.reduce((sum, d) => sum + d.attendance, 0) / data.length)
            : 0;

    const avgProductivity =
        data.length > 0
            ? Math.round(data.reduce((sum, d) => sum + d.productivity, 0) / data.length)
            : 0;

    const avgRating =
        data.length > 0
            ? (data.reduce((sum, d) => sum + d.rating, 0) / data.length).toFixed(1)
            : "0";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    {title}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl font-bold text-blue-600">{avgAttendance}%</p>
                        <p className="text-xs text-blue-700 mt-1">Kehadiran</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xl font-bold text-green-600">{avgProductivity}%</p>
                        <p className="text-xs text-green-700 mt-1">Produktivitas</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-xl font-bold text-amber-600">{avgRating}/5</p>
                        <p className="text-xs text-amber-700 mt-1">Rating</p>
                    </div>
                </div>

                {/* Simple Bar Chart */}
                <div className="space-y-4 pt-4 border-t">
                    {data.slice(-6).map((item, index) => {
                        const attendanceHeight = (item.attendance / maxValue) * chartHeight;
                        const productivityHeight = (item.productivity / maxValue) * chartHeight;

                        return (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-slate-600">
                                    <span className="font-medium">{item.month}</span>
                                    <span>Rating: {item.rating}/5</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Attendance Bar */}
                                    <div>
                                        <div className="relative h-20 bg-slate-100 rounded overflow-hidden">
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all"
                                                style={{
                                                    height: `${(item.attendance / maxValue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-center mt-1 text-slate-600">
                                            Kehadiran: {item.attendance}%
                                        </p>
                                    </div>

                                    {/* Productivity Bar */}
                                    <div>
                                        <div className="relative h-20 bg-slate-100 rounded overflow-hidden">
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-green-500 transition-all"
                                                style={{
                                                    height: `${(item.productivity / maxValue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="text-xs text-center mt-1 text-slate-600">
                                            Produktivitas: {item.productivity}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 pt-4 border-t text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded" />
                        <span className="text-slate-600">Kehadiran</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span className="text-slate-600">Produktivitas</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
