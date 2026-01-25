'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function NewWebhookPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        method: 'POST',
        events: [] as string[],
        secret: '',
        headers: '',
    });

    const availableEvents = [
        { value: 'employee.created', label: 'Employee Created' },
        { value: 'employee.updated', label: 'Employee Updated' },
        { value: 'employee.approved', label: 'Employee Approved' },
        { value: 'attendance.clock_in', label: 'Attendance Clock In' },
        { value: 'attendance.clock_out', label: 'Attendance Clock Out' },
        { value: 'leave.created', label: 'Leave Request Created' },
        { value: 'leave.approved', label: 'Leave Request Approved' },
        { value: 'leave.rejected', label: 'Leave Request Rejected' },
        { value: 'payslip.published', label: 'Payslip Published' },
        { value: 'salary.updated', label: 'Salary Updated' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Submit webhook logic here
        router.push('/admin/webhooks');
    };

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/admin/webhooks">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Webhooks
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Create New Webhook</h1>
                <p className="text-muted-foreground">
                    Configure a new webhook endpoint to receive event notifications
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                        <CardDescription>Webhook name and destination URL</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Webhook Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Employee Onboarding Webhook"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">Endpoint URL *</Label>
                            <Input
                                id="url"
                                type="url"
                                placeholder="https://your-api.com/webhooks/peoplehub"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                The URL where webhook events will be sent
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">HTTP Method</Label>
                            <Select
                                value={formData.method}
                                onValueChange={(value) => setFormData({ ...formData, method: value })}
                            >
                                <SelectTrigger id="method">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="POST">POST</SelectItem>
                                    <SelectItem value="PUT">PUT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Event Selection</CardTitle>
                        <CardDescription>Choose which events trigger this webhook</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {availableEvents.map((event) => (
                                <div key={event.value} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id={event.value}
                                        checked={formData.events.includes(event.value)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setFormData({
                                                    ...formData,
                                                    events: [...formData.events, event.value],
                                                });
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    events: formData.events.filter((ev) => ev !== event.value),
                                                });
                                            }
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <Label htmlFor={event.value} className="text-sm font-normal cursor-pointer">
                                        {event.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Optional security configuration</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="secret">Webhook Secret (optional)</Label>
                            <Input
                                id="secret"
                                type="password"
                                placeholder="Enter a secret key for HMAC signature"
                                value={formData.secret}
                                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                            />
                            <p className="text-sm text-muted-foreground">
                                Used to verify webhook authenticity via HMAC-SHA256
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="headers">Custom Headers (optional)</Label>
                            <Textarea
                                id="headers"
                                placeholder={`Authorization: Bearer token123\nX-Custom-Header: value`}
                                value={formData.headers}
                                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                                rows={4}
                            />
                            <p className="text-sm text-muted-foreground">
                                One header per line in format: Header-Name: value
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="submit">Create Webhook</Button>
                </div>
            </form>
        </div>
    );
}
