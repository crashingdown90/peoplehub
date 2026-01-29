'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreVertical, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    category: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    createdAt: string;
    updatedAt: string;
    assignedTo?: { fullName: string };
}

const statusConfig = {
    OPEN: { label: 'Open', icon: AlertCircle, color: 'bg-blue-100 text-blue-800' },
    IN_PROGRESS: { label: 'In Progress', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
    RESOLVED: { label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
    CLOSED: { label: 'Closed', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
};

const priorityConfig = {
    LOW: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
    NORMAL: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    HIGH: { label: 'High', color: 'bg-orange-100 text-orange-800' },
    URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-800' },
};

export default function TicketsListPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/tickets");
            const data = await res.json();
            if (data.success) {
                setTickets(data.data);
            }
        } catch (error) {
            console.error("Fetch tickets error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const stats = {
        open: tickets.filter((t) => t.status === 'OPEN').length,
        in_progress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
        resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
        total: tickets.length,
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
                    <p className="text-muted-foreground">
                        View and manage your support requests
                    </p>
                </div>
                <Link href="/support/tickets/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Ticket
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Open</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {stats.in_progress}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
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
                                    placeholder="Search tickets by ID or title..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[200px]">
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
                            <SelectTrigger className="w-full md:w-[200px]">
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

            {/* Tickets List */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-muted-foreground">
                            Loading tickets...
                        </div>
                    ) : (
                        <div className="divide-y">
                        {filteredTickets.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No tickets found. Try adjusting your filters.
                            </div>
                        ) : (
                            filteredTickets.map((ticket) => {
                                const StatusIcon = statusConfig[ticket.status].icon;
                                return (
                                    <div
                                        key={ticket.id}
                                        className="p-6 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Link
                                                        href={`/support/tickets/${ticket.id}`}
                                                        className="font-semibold hover:underline"
                                                    >
                                                        {ticket.ticketNumber}
                                                    </Link>
                                                    <Badge
                                                        className={
                                                            statusConfig[ticket.status].color
                                                        }
                                                    >
                                                        <StatusIcon className="mr-1 h-3 w-3" />
                                                        {statusConfig[ticket.status].label}
                                                    </Badge>
                                                    <Badge
                                                        className={
                                                            priorityConfig[ticket.priority].color
                                                        }
                                                    >
                                                        {priorityConfig[ticket.priority].label}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-lg font-medium mb-2">
                                                    {ticket.subject}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span>Category: {ticket.category}</span>
                                                    <span>•</span>
                                                    <span>
                                                        Created:{' '}
                                                        {new Date(
                                                            ticket.createdAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                    {ticket.assignedTo && (
                                                        <>
                                                            <span>•</span>
                                                            <span>
                                                                Assigned to: {ticket.assignedTo.fullName}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link
                                                            href={`/support/tickets/${ticket.id}`}
                                                        >
                                                            View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Add Comment
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        Close Ticket
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
