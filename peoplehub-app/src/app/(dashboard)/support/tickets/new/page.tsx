'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export default function NewTicketPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        category: '',
        priority: 'medium',
        description: '',
    });

    const categories = [
        'Attendance',
        'Leave',
        'Payroll',
        'Documents',
        'KPI',
        'Travel',
        'Reimbursement',
        'Technical Issue',
        'Other',
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast({
                title: 'Ticket created successfully',
                description: 'Your ticket has been submitted. We will respond soon.',
            });

            router.push('/support/tickets');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create ticket. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4">
            <div className="mb-6">
                <Link href="/support/tickets">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Tickets
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold mb-2">Create New Ticket</h1>
                <p className="text-muted-foreground">
                    Submit a support request and our team will help you
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ticket Details</CardTitle>
                    <CardDescription>
                        Provide as much detail as possible to help us resolve your issue quickly
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Brief description of your issue"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Keep it short and descriptive
                            </p>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                                required
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="priority">
                                Priority <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, priority: value })
                                }
                            >
                                <SelectTrigger id="priority">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low - Can wait</SelectItem>
                                    <SelectItem value="medium">Medium - Normal priority</SelectItem>
                                    <SelectItem value="high">High - Affects work</SelectItem>
                                    <SelectItem value="urgent">
                                        Urgent - Blocking work
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Describe your issue in detail. Include:
- What you were trying to do
- What went wrong
- Steps to reproduce (if applicable)
- Your device and browser information"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={8}
                                required
                            />
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <Label htmlFor="attachments">Attachments (optional)</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground mb-2">
                                    Drag and drop files here, or click to browse
                                </p>
                                <Button type="button" variant="outline" size="sm">
                                    Choose Files
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Max file size: 5MB. Accepted: images, PDFs
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-base">Need immediate help?</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        For urgent issues outside business hours, please contact:
                    </p>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>IT Support:</strong> +62 21 1234 5678 (ext. 123)
                        </p>
                        <p>
                            <strong>HRD:</strong> hrd@company.com
                        </p>
                        <p>
                            <strong>Emergency:</strong> +62 812 3456 7890 (24/7)
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
