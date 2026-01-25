'use client';

import { useState } from 'react';
import { BarChart, LineChart, Download, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface MetricData {
    label: string;
    value: number;
    change: number;
    trend: 'up' | 'down';
}

export default function ReportDashboardPage() {
    const [period, setPeriod] = useState('month');

    const metrics: MetricData[] = [
        { label: 'Attendance Rate', value: 96.5, change: 2.1, trend: 'up' },
        { label: 'Leave Approval Time', value: 2.3, change: -0.5, trend: 'down' },
        { label: 'On-Time Rate', value: 94.2, change: 1.8, trend: 'up' },
        { label: 'Overtime Hours', value: 124, change: -12, trend: 'down' },
    ];

    const quickReports = [
        {
            id: 'attendance-today',
            name: 'Today\'s Attendance',
            icon: Calendar,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            id: 'leave-summary',
            name: 'Leave Summary',
            icon: BarChart,
            color: 'bg-green-100 text-green-600',
        },
        {
            id: 'overtime-report',
            name: 'Overtime Report',
            icon: LineChart,
            color: 'bg-purple-100 text-purple-600',
        },
        {
            id: 'performance-metrics',
            name: 'Performance Metrics',
            icon: TrendingUp,
            color: 'bg-orange-100 text-orange-600',
        },
    ];

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Reports Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of key metrics and quick access to reports
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="quarter">This Quarter</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export All
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {metrics.map((metric) => (
                    <Card key={metric.label}>
                        <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground mb-1">{metric.label}</p>
                            <p className="text-2xl font-bold mb-2">
                                {metric.label.includes('Time') ? `${metric.value} days` :
                                    metric.label.includes('Hours') ? `${metric.value} hrs` :
                                        `${metric.value}%`}
                            </p>
                            <div className="flex items-center gap-1">
                                <TrendingUp
                                    className={`h-4 w-4 ${metric.trend === 'up'
                                            ? metric.label.includes('Time') || metric.label.includes('Hours')
                                                ? 'text-red-600 rotate-180'
                                                : 'text-green-600'
                                            : metric.label.includes('Time') || metric.label.includes('Hours')
                                                ? 'text-green-600 rotate-180'
                                                : 'text-red-600 rotate-180'
                                        }`}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {Math.abs(metric.change)}
                                    {metric.label.includes('Time') || metric.label.includes('Hours') ? ' days' : '%'} vs last {period}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Reports */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Quick Reports</CardTitle>
                    <CardDescription>Generate commonly used reports instantly</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {quickReports.map((report) => (
                            <Card
                                key={report.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer"
                            >
                                <CardContent className="p-6 text-center">
                                    <div className={`inline-flex p-4 rounded-full mb-3 ${report.color}`}>
                                        <report.icon className="h-6 w-6" />
                                    </div>
                                    <p className="font-medium">{report.name}</p>
                                    <Button variant="outline" size="sm" className="mt-3 w-full">
                                        Generate
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Reports</CardTitle>
                            <CardDescription>Your recently generated reports</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href="/reports">View All</a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                            >
                                <div>
                                    <p className="font-medium">Monthly Attendance Report</p>
                                    <p className="text-sm text-muted-foreground">
                                        Generated on Jan {20 - i}, 2024
                                    </p>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
