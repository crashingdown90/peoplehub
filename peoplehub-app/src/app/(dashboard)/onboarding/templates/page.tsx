'use client';

import { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface OnboardingTemplate {
    id: string;
    name: string;
    description: string;
    taskCount: number;
    duration: string;
    category: string;
    isActive: boolean;
    usageCount: number;
}

const mockTemplates: OnboardingTemplate[] = [
    {
        id: '1',
        name: 'Software Engineer Onboarding',
        description: 'Complete onboarding checklist for software engineering roles',
        taskCount: 15,
        duration: '30 days',
        category: 'Engineering',
        isActive: true,
        usageCount: 24,
    },
    {
        id: '2',
        name: 'Sales Representative Onboarding',
        description: 'Sales team onboarding with product and CRM training',
        taskCount: 12,
        duration: '21 days',
        category: 'Sales',
        isActive: true,
        usageCount: 18,
    },
    {
        id: '3',
        name: 'General Employee Onboarding',
        description: 'Standard onboarding for all new hires',
        taskCount: 10,
        duration: '14 days',
        category: 'General',
        isActive: true,
        usageCount: 56,
    },
];

export default function OnboardingTemplatesPage() {
    const [templates] = useState<OnboardingTemplate[]>(mockTemplates);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Onboarding Templates</h1>
                    <p className="text-muted-foreground">
                        Manage onboarding checklists for different roles
                    </p>
                </div>
                <Link href="/onboarding/templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Template
                    </Button>
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Templates</p>
                        <p className="text-2xl font-bold">{templates.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Active Templates</p>
                        <p className="text-2xl font-bold text-green-600">
                            {templates.filter((t) => t.isActive).length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground mb-1">Total Usage</p>
                        <p className="text-2xl font-bold">
                            {templates.reduce((acc, t) => acc + t.usageCount, 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex gap-2">
                                    {template.isActive && (
                                        <Badge variant="secondary">Active</Badge>
                                    )}
                                    <Badge variant="outline">{template.category}</Badge>
                                </div>
                            </div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tasks:</span>
                                    <span className="font-medium">{template.taskCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span className="font-medium">{template.duration}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Used:</span>
                                    <span className="font-medium">{template.usageCount} times</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" size="sm">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
