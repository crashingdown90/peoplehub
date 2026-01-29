'use client';

import { useState } from 'react';
import { Calendar, Download, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ShiftReport {
    date: string;
    totalShifts: number;
    staffed: number;
    understaffed: number;
    overstaffed: number;
    coverage: number; // percentage
}

const mockShiftReports: ShiftReport[] = [
    {
        date: '2024-01-22',
        totalShifts: 4,
        staffed: 3,
        understaffed: 1,
        overstaffed: 0,
        coverage: 75,
    },
    {
        date: '2024-01-23',
        totalShifts: 4,
        staffed: 4,
        understaffed: 0,
        overstaffed: 0,
        coverage: 100,
    },
    {
        date: '2024-01-24',
        totalShifts: 4,
        staffed: 2,
        understaffed: 2,
        overstaffed: 0,
        coverage: 50,
    },
];

export default function ShiftReportsPage() {
    const [reports] = useState<ShiftReport[]>(mockShiftReports);
    const [period, setPeriod] = useState('week');

    const totalCoverage = (
        reports.reduce((acc, r) => acc + r.coverage, 0) / reports.length
    ).toFixed(1);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Shift Coverage Reports</h1>
                    <p className="text-muted-foreground">
                        Analyze shift staffing and coverage trends
                    </p>
                </div>
                <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Avg Coverage</p>
                        <p className="text-2xl font-bold">{totalCoverage}%</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Fully Staffed</p>
                        <p className="text-2xl font-bold text-green-600">
                            {reports.reduce((acc, r) => acc + r.staffed, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Understaffed</p>
                        <p className="text-2xl font-bold text-red-600">
                            {reports.reduce((acc, r) => acc + r.understaffed, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Shifts</p>
                        <p className="text-2xl font-bold">
                            {reports.reduce((acc, r) => acc + r.totalShifts, 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="quarter">This Quarter</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
                {reports.map((report) => (
                    <Card key={report.date}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">
                                            {new Date(report.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {report.totalShifts} shifts scheduled
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        report.coverage >= 90
                                            ? 'default'
                                            : report.coverage >= 70
                                                ? 'secondary'
                                                : 'destructive'
                                    }
                                    className="text-lg px-4 py-1"
                                >
                                    {report.coverage}%
                                </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Fully Staffed</p>
                                    <p className="font-semibold text-green-600">{report.staffed}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Understaffed</p>
                                    <p className="font-semibold text-red-600">{report.understaffed}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Overstaffed</p>
                                    <p className="font-semibold">{report.overstaffed}</p>
                                </div>
                            </div>

                            {/* Coverage Bar */}
                            <div className="mt-4">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${report.coverage >= 90
                                                ? 'bg-green-600'
                                                : report.coverage >= 70
                                                    ? 'bg-blue-600'
                                                    : 'bg-red-600'
                                            }`}
                                        style={{ width: `${report.coverage}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
