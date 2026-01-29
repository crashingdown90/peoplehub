'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface WebhookLog {
    id: string;
    event: string;
    status: 'success' | 'failed' | 'pending';
    statusCode?: number;
    timestamp: string;
    payload: any;
    response?: string;
    duration?: number;
}

const mockLogs: WebhookLog[] = [
    {
        id: '1',
        event: 'employee.approved',
        status: 'success',
        statusCode: 200,
        timestamp: '2024-01-19T10:30:00',
        payload: { employeeId: 'EMP-001', name: 'John Doe' },
        response: '{"status":"ok","received":true}',
        duration: 142,
    },
    {
        id: '2',
        event: 'employee.created',
        status: 'success',
        statusCode: 200,
        timestamp: '2024-01-19T09:15:00',
        payload: { employeeId: 'EMP-002', name: 'Jane Smith' },
        response: '{"status":"ok"}',
        duration: 98,
    },
    {
        id: '3',
        event: 'employee.approved',
        status: 'failed',
        statusCode: 500,
        timestamp: '2024-01-18T16:45:00',
        payload: { employeeId: 'EMP-003' },
        response: '{"error":"Internal server error"}',
        duration: 5012,
    },
];

export default function WebhookLogsPage() {
    const params = useParams();
    const webhookId = params.id as string;

    const [logs] = useState<WebhookLog[]>(mockLogs);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLogs = logs.filter((log) => {
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
        const matchesSearch = log.event.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: logs.length,
        success: logs.filter((l) => l.status === 'success').length,
        failed: logs.filter((l) => l.status === 'failed').length,
        pending: logs.filter((l) => l.status === 'pending').length,
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/admin/webhooks">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Webhooks
                    </Button>
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Webhook Logs</h1>
                        <p className="text-muted-foreground">Webhook ID: {webhookId}</p>
                    </div>
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Successful</p>
                        <p className="text-2xl font-bold text-green-600">{stats.success}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Failed</p>
                        <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                        <p className="text-2xl font-bold">
                            {((stats.success / stats.total) * 100).toFixed(1)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Input
                            placeholder="Search by event name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                        />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Logs */}
            <div className="space-y-3">
                {filteredLogs.map((log) => (
                    <Card key={log.id}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {log.status === 'success' ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : log.status === 'failed' ? (
                                        <XCircle className="h-5 w-5 text-red-600" />
                                    ) : (
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    )}
                                    <div>
                                        <p className="font-semibold">{log.event}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {log.statusCode && (
                                        <Badge
                                            variant={
                                                log.statusCode >= 200 && log.statusCode < 300
                                                    ? 'default'
                                                    : 'destructive'
                                            }
                                        >
                                            {log.statusCode}
                                        </Badge>
                                    )}
                                    {log.duration && (
                                        <span className="text-sm text-muted-foreground">
                                            {log.duration}ms
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium mb-1">Payload:</p>
                                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                        {JSON.stringify(log.payload, null, 2)}
                                    </pre>
                                </div>
                                {log.response && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Response:</p>
                                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                                            {log.response}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
