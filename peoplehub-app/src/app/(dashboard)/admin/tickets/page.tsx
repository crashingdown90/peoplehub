'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Users, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AdminTicket {
    id: string;
    title: string;
    employee: string;
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: string;
    createdAt: string;
    responseTime?: number; // in minutes
}

const mockTickets: AdminTicket[] = [
    {
        id: 'TKT-001',
        title: 'Unable to clock in - GPS not working',
        employee: 'John Doe',
        category: 'Attendance',
        status: 'in_progress',
        priority: 'high',
        assignedTo: 'IT Support',
        createdAt: '2024-01-19T08:30:00',
        responseTime: 45,
    },
    {
        id: 'TKT-002',
        title: 'Payslip not showing for December',
        employee: 'Jane Smith',
        category: 'Payroll',
        status: 'resolved',
        priority: 'medium',
        assignedTo: 'Finance Team',
        createdAt: '2024-01-18T14:20:00',
        responseTime: 120,
    },
    {
        id: 'TKT-003',
        title: 'Request access to HR documents',
        employee: 'Mike Johnson',
        category: 'Documents',
        status: 'open',
        priority: 'low',
        createdAt: '2024-01-19T11:00:00',
    },
];

export default function AdminTicketDashboardPage() {
    const [tickets] = useState<AdminTicket[]>(mockTickets);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch =
            ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.employee.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const stats = {
        total: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        inProgress: tickets.filter((t) => t.status === 'in_progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        avgResponseTime: Math.round(
            tickets.filter((t) => t.responseTime).reduce((acc, t) => acc + (t.responseTime || 0), 0) /
            tickets.filter((t) => t.responseTime).length
        ),
    };

    const priorityConfig = {
        low: { color: 'bg-gray-100 text-gray-800' },
        medium: { color: 'bg-blue-100 text-blue-800' },
        high: { color: 'bg-orange-100 text-orange-800' },
        urgent: { color: 'bg-red-100 text-red-800' },
    };

    const statusConfig = {
        open: { icon: AlertCircle, color: 'bg-blue-100 text-blue-800' },
        in_progress: { icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
        resolved: { icon: CheckCircle, color: 'bg-green-100 text-green-800' },
        closed: { icon: CheckCircle, color: 'bg-gray-100 text-gray-800' },
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Ticket Dashboard (Admin)</h1>
                    <p className="text-muted-foreground">
                        Manage and respond to employee support tickets
                    </p>
                </div>
                <Link href="/support/tickets">
                    <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        All Tickets
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Tickets</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Open</p>
                        <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                        <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Avg Response</p>
                        <p className="text-2xl font-bold">{stats.avgResponseTime}m</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tickets, employees, or ticket ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredTickets.map((ticket) => {
                            const StatusIcon = statusConfig[ticket.status].icon;
                            return (
                                <div key={ticket.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Link
                                                    href={`/support/tickets/${ticket.id}`}
                                                    className="font-semibold hover:underline"
                                                >
                                                    {ticket.id}
                                                </Link>
                                                <Badge className={statusConfig[ticket.status].color}>
                                                    <StatusIcon className="mr-1 h-3 w-3" />
                                                    {ticket.status.replace('_', ' ')}
                                                </Badge>
                                                <Badge className={priorityConfig[ticket.priority].color}>
                                                    {ticket.priority}
                                                </Badge>
                                            </div>
                                            <h3 className="font-medium mb-2">{ticket.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-4 w-4" />
                                                    {ticket.employee}
                                                </span>
                                                <span>•</span>
                                                <span>{ticket.category}</span>
                                                {ticket.assignedTo && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Assigned to: {ticket.assignedTo}</span>
                                                    </>
                                                )}
                                                {ticket.responseTime && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Response: {ticket.responseTime}m</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/support/tickets/${ticket.id}`}>
                                                    View
                                                </Link>
                                            </Button>
                                            {ticket.status === 'open' && (
                                                <Button size="sm">Assign</Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
