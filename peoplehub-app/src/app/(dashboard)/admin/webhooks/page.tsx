'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreVertical, Activity, Trash2, Edit, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

interface Webhook {
    id: string;
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    lastTriggered?: string;
    successRate: number;
}

const mockWebhooks: Webhook[] = [
    {
        id: '1',
        name: 'Employee Onboarding',
        url: 'https://api.example.com/webhooks/onboarding',
        events: ['employee.created', 'employee.approved'],
        isActive: true,
        lastTriggered: '2024-01-19T10:30:00',
        successRate: 98.5,
    },
    {
        id: '2',
        name: 'Payroll Integration',
        url: 'https://payroll.company.com/api/sync',
        events: ['payslip.published', 'salary.updated'],
        isActive: true,
        lastTriggered: '2024-01-18T08:00:00',
        successRate: 100,
    },
    {
        id: '3',
        name: 'Slack Notifications',
        url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX',
        events: ['leave.approved', 'attendance.late', 'overtime.submitted'],
        isActive: false,
        lastTriggered: '2024-01-15T14:20:00',
        successRate: 95.2,
    },
];

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<Webhook[]>(mockWebhooks);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredWebhooks = webhooks.filter(
        (webhook) =>
            webhook.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            webhook.url.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleWebhook = (id: string) => {
        setWebhooks((prev) =>
            prev.map((webhook) =>
                webhook.id === id ? { ...webhook, isActive: !webhook.isActive } : webhook
            )
        );
    };

    const deleteWebhook = (id: string) => {
        if (confirm('Are you sure you want to delete this webhook?')) {
            setWebhooks((prev) => prev.filter((webhook) => webhook.id !== id));
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Webhook Management</h1>
                    <p className="text-muted-foreground">
                        Configure webhooks to integrate PeopleHub with external services
                    </p>
                </div>
                <Link href="/admin/webhooks/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Webhook
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Webhooks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{webhooks.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {webhooks.filter((w) => w.isActive).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">
                            {webhooks.filter((w) => !w.isActive).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(
                                webhooks.reduce((acc, w) => acc + w.successRate, 0) / webhooks.length
                            ).toFixed(1)}
                            %
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search webhooks by name or URL..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Webhooks List */}
            <div className="space-y-4">
                {filteredWebhooks.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            {searchQuery
                                ? 'No webhooks found matching your search.'
                                : 'No webhooks configured yet. Create your first webhook to get started.'}
                        </CardContent>
                    </Card>
                ) : (
                    filteredWebhooks.map((webhook) => (
                        <Card key={webhook.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg">{webhook.name}</h3>
                                            <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                                                {webhook.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">URL:</span>
                                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                                    {webhook.url}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigator.clipboard.writeText(webhook.url)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm text-muted-foreground">Events:</span>
                                                {webhook.events.map((event) => (
                                                    <Badge key={event} variant="outline" className="text-xs">
                                                        {event}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {webhook.lastTriggered && (
                                                    <>
                                                        <span>
                                                            Last triggered:{' '}
                                                            {new Date(webhook.lastTriggered).toLocaleString()}
                                                        </span>
                                                        <span>•</span>
                                                    </>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    Success rate:{' '}
                                                    <span
                                                        className={
                                                            webhook.successRate >= 95
                                                                ? 'text-green-600 font-medium'
                                                                : 'text-orange-600 font-medium'
                                                        }
                                                    >
                                                        {webhook.successRate}%
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={webhook.isActive}
                                            onCheckedChange={() => toggleWebhook(webhook.id)}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/webhooks/${webhook.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/webhooks/${webhook.id}/logs`}>
                                                        <Activity className="mr-2 h-4 w-4" />
                                                        View Logs
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => deleteWebhook(webhook.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
