'use client';

import { useState } from 'react';
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';

interface NotificationPreference {
    id: string;
    label: string;
    description: string;
    email: boolean;
    push: boolean;
    inApp: boolean;
}

export default function EmailPreferencesPage() {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const [preferences, setPreferences] = useState<NotificationPreference[]>([
        {
            id: 'leave_request',
            label: 'Leave Requests',
            description: 'Notifications about leave request status updates',
            email: true,
            push: true,
            inApp: true,
        },
        {
            id: 'attendance_reminder',
            label: 'Attendance Reminders',
            description: 'Daily clock in/out reminders',
            email: false,
            push: true,
            inApp: true,
        },
        {
            id: 'payslip_published',
            label: 'Payslip Published',
            description: 'Notification when new payslip is available',
            email: true,
            push: false,
            inApp: true,
        },
        {
            id: 'announcements',
            label: 'Company Announcements',
            description: 'Important announcements from HRD',
            email: true,
            push: true,
            inApp: true,
        },
        {
            id: 'overtime_approval',
            label: 'Overtime Approvals',
            description: 'Overtime request approvals and rejections',
            email: true,
            push: false,
            inApp: true,
        },
        {
            id: 'document_request',
            label: 'Document Requests',
            description: 'Status updates on document requests',
            email: true,
            push: false,
            inApp: true,
        },
        {
            id: 'kpi_updates',
            label: 'KPI Updates',
            description: 'KPI target and progress notifications',
            email: false,
            push: false,
            inApp: true,
        },
        {
            id: 'travel_request',
            label: 'Business Travel',
            description: 'Travel request and reimbursement updates',
            email: true,
            push: false,
            inApp: true,
        },
    ]);

    const togglePreference = (
        id: string,
        channel: 'email' | 'push' | 'inApp'
    ) => {
        setPreferences((prev) =>
            prev.map((pref) =>
                pref.id === id ? { ...pref, [channel]: !pref[channel] } : pref
            )
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast({
                title: 'Preferences saved',
                description: 'Your notification preferences have been updated.',
            });
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to save preferences. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const enableAllEmail = () => {
        setPreferences((prev) =>
            prev.map((pref) => ({ ...pref, email: true }))
        );
    };

    const disableAllEmail = () => {
        setPreferences((prev) =>
            prev.map((pref) => ({ ...pref, email: false }))
        );
    };

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Email & Notification Preferences</h1>
                <p className="text-muted-foreground">
                    Manage how you receive notifications from PeopleHub
                </p>
            </div>

            <Tabs defaultValue="notifications" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    <TabsTrigger value="email">Email Settings</TabsTrigger>
                    <TabsTrigger value="digest">Daily Digest</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Notification Preferences</CardTitle>
                                    <CardDescription>
                                        Choose how you want to be notified for each type of event
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={disableAllEmail}
                                    >
                                        Disable All Email
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={enableAllEmail}
                                    >
                                        Enable All Email
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Table Header */}
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 pb-4 border-b font-medium text-sm">
                                    <div>Notification Type</div>
                                    <div className="text-center">Email</div>
                                    <div className="text-center">Push</div>
                                    <div className="text-center">In-App</div>
                                </div>

                                {/* Preferences */}
                                {preferences.map((pref) => (
                                    <div
                                        key={pref.id}
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center py-4 border-b last:border-0"
                                    >
                                        <div>
                                            <Label className="font-medium">{pref.label}</Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {pref.description}
                                            </p>
                                        </div>
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={pref.email}
                                                onCheckedChange={() =>
                                                    togglePreference(pref.id, 'email')
                                                }
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={pref.push}
                                                onCheckedChange={() =>
                                                    togglePreference(pref.id, 'push')
                                                }
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={pref.inApp}
                                                onCheckedChange={() =>
                                                    togglePreference(pref.id, 'inApp')
                                                }
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <p className="text-sm text-muted-foreground">
                                Changes are saved automatically
                            </p>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Settings</CardTitle>
                            <CardDescription>
                                Configure email delivery and format preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email Delivery</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Send emails immediately or batch them
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>HTML Emails</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive emails in HTML format with styling
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Include Attachments</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Attach documents like payslips directly to emails
                                    </p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="digest" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Digest</CardTitle>
                            <CardDescription>
                                Receive a summary of activities once per day
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enable Daily Digest</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Get a single email with all your daily updates
                                    </p>
                                </div>
                                <Switch />
                            </div>
                            <div className="space-y-2">
                                <Label>Delivery Time</Label>
                                <select className="w-full border rounded-md p-2">
                                    <option>8:00 AM</option>
                                    <option>12:00 PM</option>
                                    <option>6:00 PM</option>
                                </select>
                                <p className="text-sm text-muted-foreground">
                                    Choose when you want to receive your daily digest
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
