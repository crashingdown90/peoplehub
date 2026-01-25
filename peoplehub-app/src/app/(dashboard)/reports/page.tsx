'use client';

import { useState } from 'react';
import { Download, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    lastGenerated?: string;
    icon: React.ReactNode;
    color: string;
}

export default function ReportsLibraryPage() {
    const templates: ReportTemplate[] = [
        {
            id: 'attendance-monthly',
            name: 'Monthly Attendance Report',
            description: 'Comprehensive attendance report with clock in/out times, late minutes, and overtime',
            category: 'Attendance',
            lastGenerated: '2024-01-15',
            icon: <Calendar className="h-6 w-6" />,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            id: 'leave-summary',
            name: 'Leave Balance Summary',
            description: 'Employee leave balances, requests, and utilization rates',
            category: 'Leave',
            lastGenerated: '2024-01-10',
            icon: <FileText className="h-6 w-6" />,
            color: 'bg-green-100 text-green-600',
        },
        {
            id: 'payroll-summary',
            name: 'Payroll Summary',
            description: 'Monthly payroll breakdown by department and employee',
            category: 'Payroll',
            lastGenerated: '2024-01-01',
            icon: <TrendingUp className="h-6 w-6" />,
            color: 'bg-purple-100 text-purple-600',
        },
        {
            id: 'overtime-report',
            name: 'Overtime Report',
            description: 'Overtime hours worked, approved, and paid',
            category: 'Attendance',
            icon: <Calendar className="h-6 w-6" />,
            color: 'bg-orange-100 text-orange-600',
        },
    ];

    const [selectedCategory, setSelectedCategory] = useState('all');

    const categories = Array.from(new Set(templates.map((t) => t.category)));
    const filteredTemplates = selectedCategory === 'all'
        ? templates
        : templates.filter((t) => t.category === selectedCategory);

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Report Templates</h1>
                    <p className="text-muted-foreground">
                        Choose from pre-configured report templates or build your own
                    </p>
                </div>
                <Link href="/reports/builder">
                    <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Custom Report
                    </Button>
                </Link>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory('all')}
                >
                    All
                </Button>
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                    >
                        {category}
                    </Button>
                ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                    <Card key={template.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-3 rounded-lg ${template.color}`}>
                                    {template.icon}
                                </div>
                                <Badge variant="secondary">{template.category}</Badge>
                            </div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {template.lastGenerated && (
                                <p className="text-sm text-muted-foreground mb-4">
                                    Last generated:{' '}
                                    {new Date(template.lastGenerated).toLocaleDateString()}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Generate
                                </Button>
                                <Link href={`/reports/builder?template=${template.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full" size="sm">
                                        Customize
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
