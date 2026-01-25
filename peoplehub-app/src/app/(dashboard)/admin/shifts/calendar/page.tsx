'use client';

import { useState } from 'react';
import { Calendar, Users, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CalendarShift {
    employeeName: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    color: string;
}

interface CalendarDay {
    date: string;
    dayName: string;
    shifts: CalendarShift[];
    isToday: boolean;
}

const mockCalendarData: CalendarDay[] = [
    {
        date: '2024-01-22',
        dayName: 'Monday',
        isToday: false,
        shifts: [
            {
                employeeName: 'John Doe',
                shiftName: 'Day Shift',
                startTime: '09:00',
                endTime: '17:00',
                color: 'bg-blue-100 text-blue-800',
            },
            {
                employeeName: 'Jane Smith',
                shiftName: 'Morning Shift',
                startTime: '07:00',
                endTime: '15:00',
                color: 'bg-green-100 text-green-800',
            },
        ],
    },
    {
        date: '2024-01-23',
        dayName: 'Tuesday',
        isToday: true,
        shifts: [
            {
                employeeName: 'Mike Johnson',
                shiftName: 'Evening Shift',
                startTime: '15:00',
                endTime: '23:00',
                color: 'bg-orange-100 text-orange-800',
            },
        ],
    },
];

export default function ShiftCalendarPage() {
    const [calendarData] = useState<CalendarDay[]>(mockCalendarData);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Shift Calendar</h1>
                <p className="text-muted-foreground">
                    View employee shift schedules for the week
                </p>
            </div>

            {/* Week Navigation */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <button className="px-4 py-2 border rounded-lg hover:bg-muted">
                            ← Previous Week
                        </button>
                        <div className="text-center">
                            <p className="font-semibold">Week of January 22 - 28, 2024</p>
                            <p className="text-sm text-muted-foreground">Engineering Department</p>
                        </div>
                        <button className="px-4 py-2 border rounded-lg hover:bg-muted">
                            Next Week →
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Calendar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {calendarData.map((day) => (
                    <Card
                        key={day.date}
                        className={day.isToday ? 'border-blue-500 border-2' : ''}
                    >
                        <CardContent className="p-4">
                            <div className="mb-4">
                                <p className="font-semibold">{day.dayName}</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(day.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </p>
                                {day.isToday && (
                                    <Badge className="mt-1 bg-blue-600">Today</Badge>
                                )}
                            </div>
                            <div className="space-y-3">
                                {day.shifts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No shifts</p>
                                ) : (
                                    day.shifts.map((shift, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg ${shift.color}`}
                                        >
                                            <p className="font-medium text-sm mb-1">
                                                {shift.employeeName}
                                            </p>
                                            <p className="text-xs mb-2">{shift.shiftName}</p>
                                            <div className="flex items-center gap-1 text-xs">
                                                <Clock className="h-3 w-3" />
                                                <span>
                                                    {shift.startTime} - {shift.endTime}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Legend */}
            <Card className="mt-6">
                <CardContent className="p-6">
                    <p className="font-semibold mb-3">Shift Types</p>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-100 border border-blue-800" />
                            <span className="text-sm">Day Shift (09:00 - 17:00)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-100 border border-green-800" />
                            <span className="text-sm">Morning Shift (07:00 - 15:00)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-orange-100 border border-orange-800" />
                            <span className="text-sm">Evening Shift (15:00 - 23:00)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
