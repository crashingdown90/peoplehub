'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, User, Tag, Send, Paperclip, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

interface Comment {
    id: string;
    author: string;
    role: string;
    content: string;
    createdAt: string;
    isInternal?: boolean;
}

export default function TicketDetailPage() {
    const params = useParams();
    const router = useRouter();
    const ticketId = params.id as string;

    const [newComment, setNewComment] = useState('');
    const [comments] = useState<Comment[]>([
        {
            id: '1',
            author: 'John Doe',
            role: 'Employee',
            content: 'I cannot clock in this morning. The app shows "GPS not found" error even though my location is enabled.',
            createdAt: '2024-01-19T08:30:00',
        },
        {
            id: '2',
            author: 'IT Support',
            role: 'Support',
            content: 'We are investigating this issue. Could you please try restarting your phone and clearing the app cache?',
            createdAt: '2024-01-19T09:00:00',
            isInternal: false,
        },
        {
            id: '3',
            author: 'John Doe',
            role: 'Employee',
            content: 'I tried both steps but the issue persists. I am using an iPhone 12 with iOS 17.2.',
            createdAt: '2024-01-19T09:15:00',
        },
    ]);

    const ticket = {
        id: ticketId,
        title: 'Unable to clock in - GPS not working',
        category: 'Attendance',
        status: 'in_progress',
        priority: 'high',
        createdAt: '2024-01-19T08:30:00',
        updatedAt: '2024-01-19T09:15:00',
        assignee: 'IT Support Team',
        reporter: 'John Doe',
    };

    const handleSubmitComment = () => {
        if (!newComment.trim()) return;
        // Submit comment logic here
        setNewComment('');
    };

    const handleResolve = () => {
        // Mark ticket as resolved
        router.push('/support/tickets');
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-6">
                <Link href="/support/tickets">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tickets
                    </Button>
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold">{ticket.id}</h1>
                            <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="mr-1 h-3 w-3" />
                                In Progress
                            </Badge>
                            <Badge className="bg-orange-100 text-orange-800">
                                High Priority
                            </Badge>
                        </div>
                        <h2 className="text-xl text-muted-foreground">{ticket.title}</h2>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">Close Ticket</Button>
                        <Button onClick={handleResolve}>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as Resolved
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ticket Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Category</p>
                                    <p className="font-medium">{ticket.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Reporter</p>
                                    <p className="font-medium">{ticket.reporter}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Created</p>
                                    <p className="font-medium">
                                        {new Date(ticket.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Last Updated</p>
                                    <p className="font-medium">
                                        {new Date(ticket.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversation ({comments.length})</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {comments.map((comment, index) => (
                                <div key={comment.id}>
                                    <div className="flex gap-4">
                                        <Avatar>
                                            <AvatarFallback>
                                                {comment.author.split(' ').map(n => n[0]).join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-semibold">{comment.author}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {comment.role}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(comment.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm">{comment.content}</p>
                                        </div>
                                    </div>
                                    {index < comments.length - 1 && <Separator className="my-4" />}
                                </div>
                            ))}

                            {/* New Comment */}
                            <div className="pt-4">
                                <Separator className="mb-4" />
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Add a comment..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        rows={4}
                                    />
                                    <div className="flex items-center justify-between">
                                        <Button variant="outline" size="sm">
                                            <Paperclip className="mr-2 h-4 w-4" />
                                            Attach File
                                        </Button>
                                        <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Comment
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Assignee */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Assigned To</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>IT</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{ticket.assignee}</p>
                                    <p className="text-sm text-muted-foreground">Support Team</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start">
                                <Tag className="mr-2 h-4 w-4" />
                                Change Category
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <User className="mr-2 h-4 w-4" />
                                Reassign Ticket
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Clock className="mr-2 h-4 w-4" />
                                Set Due Date
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Related Tickets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Related Tickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="text-sm">
                                    <Link href="/support/tickets/TKT-005" className="text-blue-600 hover:underline">
                                        TKT-005
                                    </Link>
                                    <p className="text-muted-foreground">GPS accuracy issues</p>
                                </div>
                                <div className="text-sm">
                                    <Link href="/support/tickets/TKT-003" className="text-blue-600 hover:underline">
                                        TKT-003
                                    </Link>
                                    <p className="text-muted-foreground">Clock in not recording</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
