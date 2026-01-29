'use client';

import { useState } from 'react';
import { ArrowLeft, Plus, Play, Save, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

export default function ReportBuilderPage() {
    const [selectedReport, setSelectedReport] = useState('');
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [selectedFields, setSelectedFields] = useState<string[]>([]);

    const reportTypes = [
        { value: 'attendance', label: 'Attendance Report', description: 'Employee attendance and time tracking' },
        { value: 'leave', label: 'Leave Report', description: 'Leave balances and requests' },
        { value: 'payroll', label: 'Payroll Report', description: 'Salary and compensation details' },
        { value: 'kpi', label: 'KPI Report', description: 'Performance indicators and achievements' },
        { value: 'overtime', label: 'Overtime Report', description: 'Overtime hours and approvals' },
    ];

    const availableFields = {
        attendance: [
            { id: 'employee_name', label: 'Employee Name' },
            { id: 'date', label: 'Date' },
            { id: 'clock_in', label: 'Clock In Time' },
            { id: 'clock_out', label: 'Clock Out Time' },
            { id: 'work_hours', label: 'Total Work Hours' },
            { id: 'status', label: 'Status' },
            { id: 'late_minutes', label: 'Late Minutes' },
        ],
        leave: [
            { id: 'employee_name', label: 'Employee Name' },
            { id: 'leave_type', label: 'Leave Type' },
            { id: 'start_date', label: 'Start Date' },
            { id: 'end_date', label: 'End Date' },
            { id: 'duration', label: 'Duration (days)' },
            { id: 'status', label: 'Status' },
            { id: 'balance', label: 'Remaining Balance' },
        ],
        payroll: [
            { id: 'employee_name', label: 'Employee Name' },
            { id: 'employee_id', label: 'Employee ID' },
            { id: 'basic_salary', label: 'Basic Salary' },
            { id: 'allowances', label: 'Allowances' },
            { id: 'deductions', label: 'Deductions' },
            { id: 'overtime', label: 'Overtime Pay' },
            { id: 'net_salary', label: 'Net Salary' },
        ],
    };

    const currentFields = selectedReport ? availableFields[selectedReport as keyof typeof availableFields] || [] : [];

    const toggleField = (fieldId: string) => {
        setSelectedFields((prev) =>
            prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]
        );
    };

    const selectAllFields = () => {
        setSelectedFields(currentFields.map((f) => f.id));
    };

    const deselectAllFields = () => {
        setSelectedFields([]);
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/reports">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Reports
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Report Builder</h1>
                <p className="text-muted-foreground">
                    Create custom reports with the data you need
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Step 1: Select Report Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Step 1: Select Report Type</CardTitle>
                            <CardDescription>Choose the type of report you want to generate</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {reportTypes.map((type) => (
                                <div
                                    key={type.value}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedReport === type.value
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'hover:border-gray-400'
                                        }`}
                                    onClick={() => setSelectedReport(type.value)}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="radio"
                                            checked={selectedReport === type.value}
                                            onChange={() => setSelectedReport(type.value)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <h3 className="font-semibold">{type.label}</h3>
                                            <p className="text-sm text-muted-foreground">{type.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Step 2: Select Period */}
                    {selectedReport && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Step 2: Select Period</CardTitle>
                                <CardDescription>Choose the time period for your report</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Period</Label>
                                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="quarter">This Quarter</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                            <SelectItem value="custom">Custom Range</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Select Fields */}
                    {selectedReport && selectedPeriod && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Step 3: Select Fields</CardTitle>
                                        <CardDescription>
                                            Choose which data fields to include in your report
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={selectAllFields}>
                                            Select All
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={deselectAllFields}>
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {currentFields.map((field) => (
                                        <div key={field.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={field.id}
                                                checked={selectedFields.includes(field.id)}
                                                onCheckedChange={() => toggleField(field.id)}
                                            />
                                            <Label
                                                htmlFor={field.id}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {field.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Preview/Summary */}
                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle className="text-base">Report Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Report Type</p>
                                <p className="font-medium">
                                    {selectedReport
                                        ? reportTypes.find((t) => t.value === selectedReport)?.label
                                        : 'Not selected'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Period</p>
                                <p className="font-medium">{selectedPeriod || 'Not selected'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground mb-1">Fields Selected</p>
                                <p className="font-medium">{selectedFields.length} fields</p>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Button
                                    className="w-full"
                                    disabled={!selectedReport || !selectedPeriod || selectedFields.length === 0}
                                >
                                    <Play className="mr-2 h-4 w-4" />
                                    Generate Report
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    disabled={!selectedReport || !selectedPeriod || selectedFields.length === 0}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
