'use client';

import { useState } from 'react';
import { Bell, BellOff, Settings, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';

interface NotificationPreference {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
}

export function MobileNotificationSettings() {
    const { toast } = useToast();
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [preferences, setPreferences] = useState<NotificationPreference[]>([
        {
            id: 'attendance',
            label: 'Attendance Reminders',
            description: 'Get reminded to clock in/out',
            enabled: true,
        },
        {
            id: 'leave',
            label: 'Leave Approvals',
            description: 'Notifications for leave request updates',
            enabled: true,
        },
        {
            id: 'payslip',
            label: 'Payslip Available',
            description: 'When new payslip is published',
            enabled: true,
        },
        {
            id: 'announcements',
            label: 'Company Announcements',
            description: 'Important company updates',
            enabled: false,
        },
    ]);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                toast({
                    title: 'Notifications enabled',
                    description: 'You will now receive push notifications',
                });
            }
        }
    };

    const togglePreference = (id: string) => {
        setPreferences((prev) =>
            prev.map((pref) =>
                pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
            )
        );
    };

    const getPermissionBadge = () => {
        switch (notificationPermission) {
            case 'granted':
                return <Badge className="bg-green-100 text-green-800">Enabled</Badge>;
            case 'denied':
                return <Badge variant="destructive">Blocked</Badge>;
            default:
                return <Badge variant="secondary">Not Set</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            {/* Permission Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Push Notifications
                            </CardTitle>
                            <CardDescription>Manage notification permissions</CardDescription>
                        </div>
                        {getPermissionBadge()}
                    </div>
                </CardHeader>
                <CardContent>
                    {notificationPermission === 'default' && (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Enable notifications to receive important updates about attendance, leave,
                                and announcements.
                            </p>
                            <Button onClick={requestPermission} className="w-full">
                                <Bell className="mr-2 h-4 w-4" />
                                Enable Notifications
                            </Button>
                        </div>
                    )}

                    {notificationPermission === 'granted' && (
                        <div className="flex items-center gap-3 text-sm">
                            <Check className="h-5 w-5 text-green-600" />
                            <p className="text-muted-foreground">
                                Notifications are enabled. Manage your preferences below.
                            </p>
                        </div>
                    )}

                    {notificationPermission === 'denied' && (
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Notifications are blocked. Please enable them in your browser settings.
                            </p>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="settings://">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Open Settings
                                </a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            {notificationPermission === 'granted' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Notification Types</CardTitle>
                        <CardDescription>Choose which notifications you want to receive</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {preferences.map((pref) => (
                                <div key={pref.id} className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <Label htmlFor={pref.id} className="font-medium">
                                            {pref.label}
                                        </Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {pref.description}
                                        </p>
                                    </div>
                                    <Switch
                                        id={pref.id}
                                        checked={pref.enabled}
                                        onCheckedChange={() => togglePreference(pref.id)}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
