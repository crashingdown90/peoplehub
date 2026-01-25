'use client';

import { useState } from 'react';
import { BarChart3, FileText, Download, Eye, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ReportData {
    employeeName: string;
    employeeId: string;
    department: string;
    clockIn: string;
    clockOut: string;
    workHours: number;
    status: 'present' | 'late' | 'absent';
    lateMinutes?: number;
}

const mockReportData: ReportData[] = [
    {
        employeeName: 'John Doe',
        employeeId: 'EMP-001',
        department: 'Engineering',
        clockIn: '08:45',
        clockOut: '17:30',
        workHours: 8.75,
        status: 'present',
    },
    {
        employeeName: 'Jane Smith',
        employeeId: 'EMP-002',
        department: 'Marketing',
        clockIn: '09:15',
        clockOut: '17:45',
        workHours: 8.5,
        status: 'late',
        lateMinutes: 15,
    },
    {
        employeeName: 'Mike Johnson',
        employeeId: 'EMP-003',
        department: 'Sales',
        clockIn: '-',
        clockOut: '-',
        workHours: 0,
        status: 'absent',
    },
];

export default function ReportViewerPage() {
    const [reportData] = useState<ReportData[]>(mockReportData);

    const statusConfig = {
        present: { label: 'Present', color: 'bg-green-100 text-green-800' },
        late: { label: 'Late', color: 'bg-yellow-100 text-yellow-800' },
        absent: { label: 'Absent', color: 'bg-red-100 text-red-800' },
    };

    const summary = {
        totalEmployees: reportData.length,
        present: reportData.filter((r) => r.status === 'present').length,
        late: reportData.filter((r) => r.status === 'late').length,
        absent: reportData.filter((r) => r.status === 'absent').length,
        avgWorkHours: (
            reportData.reduce((acc, r) => acc + r.workHours, 0) / reportData.length
        ).toFixed(2),
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Daily Attendance Report</h1>
                    <p className="text-muted-foreground">
                        January 19, 2024 • Engineering Department
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Export PDF
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Excel
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Employees</p>
                        <p className="text-2xl font-bold">{summary.totalEmployees}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Present</p>
                        <p className="text-2xl font-bold text-green-600">{summary.present}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Late</p>
                        <p className="text-2xl font-bold text-yellow-600">{summary.late}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Absent</p>
                        <p className="text-2xl font-bold text-red-600">{summary.absent}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Avg Hours</p>
                        <p className="text-2xl font-bold">{summary.avgWorkHours}h</p>
                    </CardContent>
                </Card>
            </div>

            {/* Report Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Details</CardTitle>
                    <CardDescription>Employee-wise attendance breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Work Hours</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reportData.map((row) => (
                                    <TableRow key={row.employeeId}>
                                        <TableCell className="font-medium">
                                            {row.employeeName}
                                        </TableCell>
                                        <TableCell>{row.employeeId}</TableCell>
                                        <TableCell>{row.department}</TableCell>
                                        <TableCell>{row.clockIn}</TableCell>
                                        <TableCell>{row.clockOut}</TableCell>
                                        <TableCell>
                                            {row.workHours > 0 ? `${row.workHours}h` : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusConfig[row.status].color}>
                                                {statusConfig[row.status].label}
                                                {row.lateMinutes && ` (+${row.lateMinutes}m)`}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Chart Placeholder */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Attendance Trends
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                        <div className="text-center text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                            <p>Chart visualization would appear here</p>
                            <p className="text-sm">Integration with charting library required</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
