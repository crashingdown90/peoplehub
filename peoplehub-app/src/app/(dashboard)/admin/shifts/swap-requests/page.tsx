'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, User2, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SwapRequest {
    id: string;
    requestor: {
        name: string;
        id: string;
    };
    partner: {
        name: string;
        id: string;
    };
    originalShift: {
        date: string;
        name: string;
        time: string;
    };
    swapShift: {
        date: string;
        name: string;
        time: string;
    };
    reason: string;
    status: 'pending' | 'partner_approved' | 'approved' | 'rejected';
    createdAt: string;
}

const mockSwapRequests: SwapRequest[] = [
    {
        id: '1',
        requestor: {
            name: 'John Doe',
            id: 'EMP-001',
        },
        partner: {
            name: 'Jane Smith',
            id: 'EMP-002',
        },
        originalShift: {
            date: '2024-01-22',
            name: 'Day Shift',
            time: '09:00 - 17:00',
        },
        swapShift: {
            date: '2024-01-23',
            name: 'Day Shift',
            time: '09:00 - 17:00',
        },
        reason: 'Family emergency on Monday',
        status: 'partner_approved',
        createdAt: '2024-01-19T10:30:00',
    },
    {
        id: '2',
        requestor: {
            name: 'Mike Johnson',
            id: 'EMP-003',
        },
        partner: {
            name: 'Sarah Williams',
            id: 'EMP-004',
        },
        originalShift: {
            date: '2024-01-24',
            name: 'Morning Shift',
            time: '07:00 - 15:00',
        },
        swapShift: {
            date: '2024-01-25',
            name: 'Morning Shift',
            time: '07:00 - 15:00',
        },
        reason: 'Doctor appointment',
        status: 'pending',
        createdAt: '2024-01-19T09:15:00',
    },
];

export default function ShiftSwapRequestsPage() {
    const [requests, setRequests] = useState<SwapRequest[]>(mockSwapRequests);

    const handleApprove = (id: string) => {
        setRequests((prev) =>
            prev.map((req) => (req.id === id ? { ...req, status: 'approved' as const } : req))
        );
    };

    const handleReject = (id: string) => {
        setRequests((prev) =>
            prev.map((req) => (req.id === id ? { ...req, status: 'rejected' as const } : req))
        );
    };

    const statusConfig = {
        pending: { label: 'Pending Partner', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
        partner_approved: { label: 'Pending Approval', color: 'bg-blue-100 text-blue-800', icon: Clock },
        approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
        rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Shift Swap Requests</h1>
                <p className="text-muted-foreground">
                    Review and approve shift swap requests from employees
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
                        <p className="text-2xl font-bold">{requests.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text- muted-foreground mb-1">Pending Partner</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {requests.filter((r) => r.status === 'pending').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {requests.filter((r) => r.status === 'partner_approved').length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Approved</p>
                        <p className="text-2xl font-bold text-green-600">
                            {requests.filter((r) => r.status === 'approved').length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {requests.map((request) => {
                    const StatusIcon = statusConfig[request.status].icon;
                    return (
                        <Card key={request.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Badge className={statusConfig[request.status].color}>
                                            <StatusIcon className="mr-1 h-3 w-3" />
                                            {statusConfig[request.status].label}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(request.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 mb-4">
                                    {/* Requestor */}
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Requestor</p>
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {request.requestor.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{request.requestor.name}</p>
                                                <p className="text-sm text-muted-foreground">{request.requestor.id}</p>
                                            </div>
                                        </div>
                                        <div className="bg-muted p-3 rounded-lg">
                                            <p className="text-sm font-medium mb-1">Original Shift</p>
                                            <p className="text-sm">{new Date(request.originalShift.date).toLocaleDateString()}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {request.originalShift.name} • {request.originalShift.time}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Partner */}
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-2">Swap Partner</p>
                                        <div className="flex items-center gap-3 mb-3">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {request.partner.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold">{request.partner.name}</p>
                                                <p className="text-sm text-muted-foreground">{request.partner.id}</p>
                                            </div>
                                        </div>
                                        <div className="bg-muted p-3 rounded-lg">
                                            <p className="text-sm font-medium mb-1">Swap Shift</p>
                                            <p className="text-sm">{new Date(request.swapShift.date).toLocaleDateString()}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {request.swapShift.name} • {request.swapShift.time}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-sm font-medium mb-1">Reason:</p>
                                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                                </div>

                                {request.status === 'partner_approved' && (
                                    <div className="flex gap-3">
                                        <Button onClick={() => handleReject(request.id)} variant="outline">
                                            Reject
                                        </Button>
                                        <Button onClick={() => handleApprove(request.id)}>
                                            Approve Swap
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
