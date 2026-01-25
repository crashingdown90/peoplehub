'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, Users, Clock, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ShiftAssignment {
    id: string;
    employeeName: string;
    employeeId: string;
    department: string;
    shift: {
        name: string;
        startTime: string;
        endTime: string;
        color: string;
    };
    days: string[];
}

const mockAssignments: ShiftAssignment[] = [
    {
        id: '1',
        employeeName: 'John Doe',
        employeeId: 'EMP-001',
        department: 'Engineering',
        shift: {
            name: 'Day Shift',
            startTime: '09:00',
            endTime: '17:00',
            color: 'bg-green-100 text-green-800',
        },
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    {
        id: '2',
        employeeName: 'Jane Smith',
        employeeId: 'EMP-002',
        department: 'Customer Service',
        shift: {
            name: 'Morning Shift',
            startTime: '07:00',
            endTime: '15:00',
            color: 'bg-blue-100 text-blue-800',
        },
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
];

export default function ShiftAssignmentPage() {
    const [assignments] = useState<ShiftAssignment[]>(mockAssignments);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Shift Assignment</h1>
                    <p className="text-muted-foreground">
                        Assign employees to shift schedules
                    </p>
                </div>
                <Link href="/admin/shifts/assign/new">
                    <Button>
                        <Users className="mr-2 h-4 w-4" />
                        Assign Shifts
                    </Button>
                </Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Assigned</p>
                                <p className="text-2xl font-bold">{assignments.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CalendarIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Active Schedules</p>
                                <p className="text-2xl font-bold">4</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Clock className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Shifts Today</p>
                                <p className="text-2xl font-bold">228</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Assignments List */}
            <Card>
                <CardHeader>
                    <CardTitle>Shift Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assignments.map((assignment) => (
                            <Card key={assignment.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h3 className="font-semibold text-lg">
                                                    {assignment.employeeName}
                                                </h3>
                                                <Badge variant="outline">{assignment.employeeId}</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-muted-foreground">Department:</span>
                                                    <span className="font-medium">{assignment.department}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={assignment.shift.color}>
                                                        {assignment.shift.name}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {assignment.shift.startTime} - {assignment.shift.endTime}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm text-muted-foreground">Working Days:</span>
                                                    {assignment.days.map((day) => (
                                                        <Badge key={day} variant="secondary" className="text-xs">
                                                            {day.slice(0, 3)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
