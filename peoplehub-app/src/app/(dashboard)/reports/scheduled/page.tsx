'use client';

import { useState } from 'react';
import { Calendar, Download, Eye, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

interface ScheduledReport {
    id: string;
    name: string;
    type: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    schedule: string;
    lastRun?: string;
    nextRun: string;
    recipients: string[];
    isActive: boolean;
}

const mockScheduledReports: ScheduledReport[] = [
    {
        id: '1',
        name: 'Daily Attendance Report',
        type: 'Attendance',
        frequency: 'daily',
        schedule: 'Every day at 9:00 AM',
        lastRun: '2024-01-19T09:00:00',
        nextRun: '2024-01-20T09:00:00',
        recipients: ['hr@company.com', 'manager@company.com'],
        isActive: true,
    },
    {
        id: '2',
        name: 'Weekly Leave Summary',
        type: 'Leave',
        frequency: 'weekly',
        schedule: 'Every Monday at 8:00 AM',
        lastRun: '2024-01-15T08:00:00',
        nextRun: '2024-01-22T08:00:00',
        recipients: ['hr@company.com'],
        isActive: true,
    },
    {
        id: '3',
        name: 'Monthly Payroll Report',
        type: 'Payroll',
        frequency: 'monthly',
        schedule: '1st of every month at 10:00 AM',
        lastRun: '2024-01-01T10:00:00',
        nextRun: '2024-02-01T10:00:00',
        recipients: ['finance@company.com', 'hr@company.com'],
        isActive: true,
    },
];

export default function ScheduledReportsPage() {
    const [reports] = useState<ScheduledReport[]>(mockScheduledReports);
    const [frequencyFilter, setFrequencyFilter] = useState('all');

    const filteredReports = frequencyFilter === 'all'
        ? reports
        : reports.filter((r) => r.frequency === frequencyFilter);

    const frequencyConfig = {
        daily: { label: 'Daily', color: 'bg-blue-100 text-blue-800' },
        weekly: { label: 'Weekly', color: 'bg-green-100 text-green-800' },
        monthly: { label: 'Monthly', color: 'bg-purple-100 text-purple-800' },
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Scheduled Reports</h1>
                    <p className="text-muted-foreground">
                        Automated reports delivered on schedule
                    </p>
                </div>
                <Link href="/reports/builder">
                    <Button>
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule New Report
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Scheduled</p>
                        <p className="text-2xl font-bold">{reports.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Active</p>
                        <p className="text-2xl font-bold text-green-600">
                            {reports.filter((r) => r.isActive).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Run Today</p>
                        <p className="text-2xl font-bold">3</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                        <p className="text-2xl font-bold">98.5%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Filter by frequency:</span>
                        <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Frequencies</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Reports List */}
            <div className="space-y-4">
                {filteredReports.map((report) => (
                    <Card key={report.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <FileText className="h-5 w-5 text-muted-foreground" />
                                        <h3 className="font-semibold text-lg">{report.name}</h3>
                                        <Badge className={frequencyConfig[report.frequency].color}>
                                            {frequencyConfig[report.frequency].label}
                                        </Badge>
                                        {report.isActive && (
                                            <Badge variant="secondary">Active</Badge>
                                        )}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-3">
                                        <div>
                                            <p className="text-muted-foreground">Report Type</p>
                                            <p className="font-medium">{report.type}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Schedule</p>
                                            <p className="font-medium">{report.schedule}</p>
                                        </div>
                                        {report.lastRun && (
                                            <div>
                                                <p className="text-muted-foreground">Last Run</p>
                                                <p>{new Date(report.lastRun).toLocaleString()}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-muted-foreground">Next Run</p>
                                            <p>{new Date(report.nextRun).toLocaleString()}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-muted-foreground mb-1">Recipients</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {report.recipients.map((email, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                        {email}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    View History
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Run Now
                                </Button>
                                <Button variant="outline" size="sm">
                                    Edit Schedule
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
