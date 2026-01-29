'use client';

import { useState } from 'react';
import { Send, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TestResult {
    timestamp: string;
    status: 'success' | 'error';
    statusCode: number;
    responseTime: number;
    response: string;
}

export default function WebhookTestingToolPage() {
    const [webhookId, setWebhookId] = useState('');
    const [eventType, setEventType] = useState('');
    const [payload, setPayload] = useState('{\n  "employeeId": "EMP-001",\n  "name": "John Doe"\n}');
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const webhooks = [
        { id: '1', name: 'Employee Onboarding Webhook', url: 'https://api.example.com/webhook' },
        { id: '2', name: 'Payroll Notification Webhook', url: 'https://api.example.com/payroll' },
    ];

    const eventTypes = [
        'employee.created',
        'employee.approved',
        'attendance.clock_in',
        'leave.approved',
        'payslip.published',
    ];

    const handleTest = async () => {
        setIsTesting(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const mockResult: TestResult = {
            timestamp: new Date().toISOString(),
            status: Math.random() > 0.3 ? 'success' : 'error',
            statusCode: Math.random() > 0.3 ? 200 : 500,
            responseTime: Math.floor(Math.random() * 500) + 100,
            response: Math.random() > 0.3
                ? '{"status":"ok","received":true,"processedAt":"2024-01-19T11:23:45Z"}'
                : '{"error":"Internal server error","message":"Connection timeout"}',
        };

        setTestResult(mockResult);
        setIsTesting(false);
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Webhook Testing Tool</h1>
                <p className="text-muted-foreground">
                    Test webhook endpoints with custom payloads
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Configuration</CardTitle>
                            <CardDescription>Select webhook and event to test</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="webhook">Webhook *</Label>
                                <Select value={webhookId} onValueChange={setWebhookId}>
                                    <SelectTrigger id="webhook">
                                        <SelectValue placeholder="Select webhook" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {webhooks.map((webhook) => (
                                            <SelectItem key={webhook.id} value={webhook.id}>
                                                {webhook.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {webhookId && (
                                    <p className="text-sm text-muted-foreground">
                                        URL: {webhooks.find((w) => w.id === webhookId)?.url}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="event">Event Type *</Label>
                                <Select value={eventType} onValueChange={setEventType}>
                                    <SelectTrigger id="event">
                                        <SelectValue placeholder="Select event type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eventTypes.map((event) => (
                                            <SelectItem key={event} value={event}>
                                                {event}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payload">Payload (JSON) *</Label>
                                <Textarea
                                    id="payload"
                                    value={payload}
                                    onChange={(e) => setPayload(e.target.value)}
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Enter a valid JSON payload to send with the webhook
                                </p>
                            </div>

                            <Button
                                onClick={handleTest}
                                disabled={!webhookId || !eventType || isTesting}
                                className="w-full"
                            >
                                {isTesting ? (
                                    <>
                                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                                        Testing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4" />
                                        Send Test Webhook
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Test Result */}
                    {testResult && (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Test Result</CardTitle>
                                    <Badge
                                        variant={testResult.status === 'success' ? 'default' : 'destructive'}
                                    >
                                        {testResult.status === 'success' ? (
                                            <CheckCircle className="mr-1 h-3 w-3" />
                                        ) : (
                                            <XCircle className="mr-1 h-3 w-3" />
                                        )}
                                        {testResult.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status Code</p>
                                        <p className="font-semibold text-lg">{testResult.statusCode}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Response Time</p>
                                        <p className="font-semibold text-lg">{testResult.responseTime}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Timestamp</p>
                                        <p className="text-sm">{new Date(testResult.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium mb-2">Response Body:</p>
                                    <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                                        {JSON.stringify(JSON.parse(testResult.response), null, 2)}
                                    </pre>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Info Panel */}
                <div>
                    <Card className="sticky top-4">
                        <CardHeader>
                            <CardTitle className="text-base">Testing Guide</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="font-semibold mb-2">How to test:</p>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                    <li>Select a webhook endpoint</li>
                                    <li>Choose an event type</li>
                                    <li>Customize the JSON payload</li>
                                    <li>Click "Send Test Webhook"</li>
                                </ol>
                            </div>

                            <div>
                                <p className="font-semibold mb-2">Response codes:</p>
                                <ul className="space-y-1 text-muted-foreground">
                                    <li>• 200-299: Success</li>
                                    <li>• 400-499: Client error</li>
                                    <li>• 500-599: Server error</li>
                                </ul>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-900">
                                    <strong>Tip:</strong> Test webhooks in a development environment first
                                    before deploying to production.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
