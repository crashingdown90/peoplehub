'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, TrendingUp, CheckCircle } from 'lucide-react';

interface DashboardCard {
    id: string;
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
}

export function MobileDashboardCards() {
    const cards: DashboardCard[] = [
        {
            id: 'attendance-today',
            title: 'Today\'s Attendance',
            value: 'Clocked In',
            subtitle: '08:45 AM',
            icon: <Clock className="h-5 w-5" />,
            color: 'bg-blue-100 text-blue-600',
            trend: {
                value: 'On time',
                isPositive: true,
            },
        },
        {
            id: 'leave-balance',
            title: 'Leave Balance',
            value: '12',
            subtitle: 'Days remaining',
            icon: <CheckCircle className="h-5 w-5" />,
            color: 'bg-green-100 text-green-600',
        },
        {
            id: 'team-status',
            title: 'Team Present',
            value: '18/20',
            subtitle: 'Members online',
            icon: <Users className="h-5 w-5" />,
            color: 'bg-purple-100 text-purple-600',
            trend: {
                value: '+2 from yesterday',
                isPositive: true,
            },
        },
        {
            id: 'performance',
            title: 'This Month',
            value: '96%',
            subtitle: 'Attendance rate',
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'bg-orange-100 text-orange-600',
            trend: {
                value: '+4% from last month',
                isPositive: true,
            },
        },
    ];

    return (
        <div className="p-4 space-y-3">
            {cards.map((card) => (
                <Card key={card.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                                <p className="text-2xl font-bold mb-1">{card.value}</p>
                                {card.subtitle && (
                                    <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                                )}
                                {card.trend && (
                                    <p
                                        className={`text-xs mt-2 ${card.trend.isPositive
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}
                                    >
                                        {card.trend.value}
                                    </p>
                                )}
                            </div>
                            <div className={`p-3 rounded-full ${card.color}`}>
                                {card.icon}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
