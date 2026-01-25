'use client';

import { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Users, Clock, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ShiftTemplate {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    color: string;
    assignedEmployees: number;
}

const mockShiftTemplates: ShiftTemplate[] = [
    {
        id: '1',
        name: 'Morning Shift',
        startTime: '07:00',
        endTime: '15:00',
        color: 'bg-blue-100 text-blue-800',
        assignedEmployees: 45,
    },
    {
        id: '2',
        name: 'Day Shift',
        startTime: '09:00',
        endTime: '17:00',
        color: 'bg-green-100 text-green-800',
        assignedEmployees: 120,
    },
    {
        id: '3',
        name: 'Evening Shift',
        startTime: '15:00',
        endTime: '23:00',
        color: 'bg-orange-100 text-orange-800',
        assignedEmployees: 38,
    },
    {
        id: '4',
        name: 'Night Shift',
        startTime: '23:00',
        endTime: '07:00',
        color: 'bg-purple-100 text-purple-800',
        assignedEmployees: 25,
    },
];

export default function ShiftManagementPage() {
    const [shifts] = useState<ShiftTemplate[]>(mockShiftTemplates);

    const totalAssigned = shifts.reduce((acc, shift) => acc + shift.assignedEmployees, 0);

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Shift Management</h1>
                    <p className="text-muted-foreground">
                        Manage shift templates and employee schedules
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/shifts/calendar">
                        <Button variant="outline">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            View Calendar
                        </Button>
                    </Link>
                    <Link href="/admin/shifts/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Shift Template
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Shift Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shifts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Employees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAssigned}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{shifts.length - 1}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Swap Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3</div>
                        <p className="text-xs text-muted-foreground">Pending approval</p>
                    </CardContent>
                </Card>
            </div>

            {/* Shift Templates */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Shift Templates</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shifts.map((shift) => (
                            <Card key={shift.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-lg mb-1">{shift.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {shift.startTime} - {shift.endTime}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge className={shift.color}>{shift.name.split(' ')[0]}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span>{shift.assignedEmployees} employees assigned</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/shifts/${shift.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
                    <Link href="/admin/shifts/assign">
                        <CardContent className="p-6">
                            <Users className="h-8 w-8 mb-3 text-blue-600" />
                            <h3 className="font-semibold mb-1">Assign Shifts</h3>
                            <p className="text-sm text-muted-foreground">
                                Assign employees to shift templates
                            </p>
                        </CardContent>
                    </Link>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
                    <Link href="/admin/shifts/swap-requests">
                        <CardContent className="p-6">
                            <CalendarIcon className="h-8 w-8 mb-3 text-green-600" />
                            <h3 className="font-semibold mb-1">Swap Requests</h3>
                            <p className="text-sm text-muted-foreground">
                                Review and approve shift swap requests
                            </p>
                        </CardContent>
                    </Link>
                </Card>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" asChild>
                    <Link href="/admin/shifts/reports">
                        <CardContent className="p-6">
                            <Clock className="h-8 w-8 mb-3 text-orange-600" />
                            <h3 className="font-semibold mb-1">Shift Reports</h3>
                            <p className="text-sm text-muted-foreground">
                                View shift coverage and attendance reports
                            </p>
                        </CardContent>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
