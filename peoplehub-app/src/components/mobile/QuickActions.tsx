'use client';

import { Camera, MapPin, Clock, FileText, User, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface QuickAction {
    id: string;
    title: string;
    icon: React.ReactNode;
    href: string;
    color: string;
}

export function MobileQuickActions() {
    const quickActions: QuickAction[] = [
        {
            id: 'clock-in',
            title: 'Clock In',
            icon: <Clock className="h-6 w-6" />,
            href: '/attendance/clock-in',
            color: 'bg-blue-100 text-blue-600',
        },
        {
            id: 'leave-request',
            title: 'Request Leave',
            icon: <FileText className="h-6 w-6" />,
            href: '/leave/new',
            color: 'bg-green-100 text-green-600',
        },
        {
            id: 'attendance-photo',
            title: 'Take Photo',
            icon: <Camera className="h-6 w-6" />,
            href: '/attendance/photo',
            color: 'bg-purple-100 text-purple-600',
        },
        {
            id: 'location',
            title: 'Check Location',
            icon: <MapPin className="h-6 w-6" />,
            href: '/attendance/location',
            color: 'bg-orange-100 text-orange-600',
        },
        {
            id: 'profile',
            title: 'My Profile',
            icon: <User className="h-6 w-6" />,
            href: '/profile',
            color: 'bg-pink-100 text-pink-600',
        },
        {
            id: 'notifications',
            title: 'Notifications',
            icon: <Bell className="h-6 w-6" />,
            href: '/notifications',
            color: 'bg-yellow-100 text-yellow-600',
        },
    ];

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action) => (
                    <Link key={action.id} href={action.href}>
                        <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-4 flex flex-col items-center text-center">
                                <div className={`p-3 rounded-full mb-2 ${action.color}`}>
                                    {action.icon}
                                </div>
                                <p className="text-xs font-medium">{action.title}</p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
