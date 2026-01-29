"use client";

// Department Breakdown Donut Chart

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DepartmentData {
    name: string;
    count: number;
    color: string;
}

interface DepartmentBreakdownProps {
    data?: DepartmentData[];
    className?: string;
}

// Generate sample data
function generateSampleData(): DepartmentData[] {
    return [
        { name: "IT & Engineering", count: 65, color: "#3b82f6" }, // blue
        { name: "Marketing & Sales", count: 48, color: "#10b981" }, // green
        { name: "Finance & Accounting", count: 32, color: "#f59e0b" }, // orange
        { name: "HR & Admin", count: 28, color: "#8b5cf6" }, // purple
        { name: "Operations", count: 42, color: "#ec4899" }, // pink
        { name: "Customer Service", count: 30, color: "#06b6d4" }, // cyan
    ];
}

export function DepartmentBreakdown({ data, className }: DepartmentBreakdownProps) {
    const departments = data || generateSampleData();
    const total = departments.reduce((sum, dept) => sum + dept.count, 0);

    // Calculate percentages and angles for donut chart
    const segments = departments.map((dept, index, arr) => {
        const percentage = (dept.count / total) * 100;
        const angle = (dept.count / total) * 360;
        const startAngle = arr.slice(0, index).reduce((sum, d) => sum + (d.count / total) * 360, 0);

        return {
            ...dept,
            percentage,
            startAngle,
            endAngle: startAngle + angle,
        };
    });

    // SVG donut chart
    const size = 200;
    const strokeWidth = 30;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <Card className={cn("", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Distribusi per Departemen</CardTitle>
                        <CardDescription className="mt-1">
                            Total {total} karyawan
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Donut Chart */}
                    <div className="flex items-center justify-center">
                        <div className="relative">
                            <svg width={size} height={size} className="transform -rotate-90">
                                <circle
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    stroke="#f1f5f9"
                                    strokeWidth={strokeWidth}
                                />
                                {segments.map((segment, index) => {
                                    const dashArray = (segment.percentage / 100) * circumference;
                                    const dashOffset =
                                        circumference - (segment.startAngle / 360) * circumference;

                                    return (
                                        <circle
                                            key={index}
                                            cx={size / 2}
                                            cy={size / 2}
                                            r={radius}
                                            fill="none"
                                            stroke={segment.color}
                                            strokeWidth={strokeWidth}
                                            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                                            strokeDashoffset={-dashOffset}
                                            className="transition-all hover:opacity-80 cursor-pointer"
                                        />
                                    );
                                })}
                            </svg>
                            {/* Center label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold">{total}</div>
                                <div className="text-xs text-muted-foreground">Karyawan</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-3">
                        {segments.map((segment, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                            >
                                <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
                                    <div
                                        className="h-3 w-3 rounded-full shrink-0"
                                        style={{ backgroundColor: segment.color }}
                                    />
                                    <span className="text-sm font-medium truncate" title={segment.name}>{segment.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-sm font-semibold">{segment.count}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {segment.percentage.toFixed(1)}%
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

DepartmentBreakdown.displayName = "DepartmentBreakdown";
